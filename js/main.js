define(["./util", "./pq/priority-queue.min", "./q/queue.min"],function(util, priority_queue, queue){

  queue()
    .defer(d3.csv, "../data/board-1.csv")           //board
    .defer(d3.json, "../data/board-1.robots.json")  //robots
    .defer(d3.json, "../data/board-1.goals.json")   //goal tiles
    .await(main);

  var board = {
    "width":600,
    "wall_width":8,
    "code_length":2
  };
  board.colors = {
    "red":"#F99",
    "black":"#444",
    "blue":"#9CF",
    "yellow":"#FF9",
    "green":"#9F9"
  };

  function main(error, rows, bots, goals){
    util.assert(!error, "error fetching config file(s)");
    polyfill();
    init_board(rows);
    init_dom();
    init_walls();
    init_robots(bots);
    init_graph();
    board.goals = goals;
    //board.goal = random goal
    board.goal = get_goal("yellow", "moon");
    board.q = new priority_queue();
    //pass in comparator based on A* distance
    //push initial state onto stack
    console.log(board);
    console.log(solve());
  }

  function solve(){
    while(board.q.length !== 0){
      next = board.q.dequeue();
      if(is_goal(next)){
        return next;
      }else{
        //expand and enqueue
        //expand function should compute distance traveled (+1) and left
        //distance left
        //expand function points to predecessor
        //state is
        //  robots (with current and prior state)
        //  distance traveled
        //  distnace left
        //  heuristic (sum of distances)
      }
    }
    return undefined;
  }

  function is_goal(state){
    //state depth > 1
    //right color robot on goal square
  }

  function init_robots(bots_arr){
    board.svg
      .append("g")
      .attr("id", "robots")
      .selectAll("g")
      .data(bots_arr)
      .enter().append("g")
      .classed("robot", true)
      .attr("id", function(d){ return d.color; })
      .append("circle")
      .attr("cx", function(d){ return (d.col * board.cell) +  board.cell/2; })
      .attr("cy", function(d){ return (d.row * board.cell) + board.cell/2; })
      .attr("r", 0.35 * board.cell)
      .attr("fill", function(d){ return board.colors[d.color]; });

    board.robots = {};
    for(var i = 0; i < bots_arr.length; i++){
      var bot = bots_arr[i];
      board.robots[bot.color] = bot;
    }
  }

  /* store graph as adjacency list */
  function init_graph(){
    var list = [];
    var max_index = board.rows * board.cols - 1;
    for(var r = 0; r < board.rows; r++){
      for(var c = 0; c < board.cols; c++){
        var code = board.data[r][c];
        var index = r * board.rows + c;
        var right = index + 1;
        var below = index + board.cols;
        var adjacents = [];
        //open to the right and not on the right edge
        if(code.charAt(0) === '0' && c < (board.cols - 1)){
          util.assert(right >= 0 && right <= max_index);
          adjacents.push(right);
        //open to the bottom and not on the bottom edge
        }if(code.charAt(1) === '0' && r < (board.rows - 1)){
          util.assert(below >= 0 && below <= max_index);
          adjacents.push(below);
        }
        list.push(adjacents);
      }
    }
    board.graph = list;
    symmetric_closure(board.graph);
  }

  /* suppose a is just to the left of b in row-major traversal.
   * PRE: init_graph has added b to a's adjacency list
   * POST: now we've added a to b's adjacency list */
  function symmetric_closure(list){
    for(var i = 0; i < list.length; i++){
      var neighbors = list[i];
      for(var j = 0; j < neighbors.length; j++){
        n = neighbors[j];
        //only look back so no redundancy (alrady looked ahead in init_graph)
        if(n > i)
          //if list[i] can reach n, list[n] can reach i (symmetry)
          list[n].push(i);
        }
    }
  }

  function init_walls(){
    //top stroke
    append_wall(board.svg.selectAll("g.row.top g.cell"), "top");
    //bottom stroke
    append_wall(board.svg.selectAll("g.row.bottom g.cell"), "bottom");
    append_wall(board.svg.selectAll("g.cell.wall-bottom"), "bottom");
    //left stroke
    append_wall(board.svg.selectAll("g.cell.left"), "left");
    //right stroke
    append_wall(board.svg.selectAll("g.cell.right"), "right");
    append_wall(board.svg.selectAll("g.cell.wall-right"), "right");
  }

  function append_wall(sel, dir){
    var coords = {
      "top":    [0, board.cell, 0, 0],
      "bottom": [0, board.cell, board.cell, board.cell],
      "left":   [0, 0, 0, board.cell],
      "right":  [board.cell, board.cell, 0, board.cell],
    };
    util.assert(dir in coords);
    var xy = coords[dir];
    sel
      .append("line")
      .classed("wall", true)
      .attr("x1", xy[0])
      .attr("x2", xy[1])
      .attr("y1", xy[2])
      .attr("y2", xy[3]);
  }

  function init_dom(){
    board.svg = d3.select("body").append("svg")
      .attr("id", "board")
      .attr("width", board.width)
      .attr("height", board.width);
    board.svg
      //g for each row
      .selectAll("g")
      .data(board.data)
      .enter().append("g")
      .classed("row", true)
      .classed("top", has_index(0))
      .classed("bottom", has_index(board.rows - 1))
      .attr("transform", function(d, i){
        return "translate" + util.wrap(0, i*board.cell);
      })
        //for each row, a g for each cell
        .selectAll("g")
        .data(function(d, i){ return d; })
        .enter().append("g")
        .classed("cell", true)
        .classed("left", has_index(0))
        .classed("right", has_index(board.cols - 1))
        .attr("width", board.cell)
        .attr("height", board.cell)
        .attr("transform", function(d, i){
            return "translate" + util.wrap(i*board.cell,0);
        })
        .classed("wall-bottom", function(d){ return d === "01" || d === "11";})
        .classed("wall-right", function(d){ return d === "10" || d === "11";})
        //grid cell
        .append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 0);
  }

  function has_index(x){
    return function(d, i, e){
      return i === x;
    };
  }

  function init_board(rows){
    board.rows = rows.length;
    util.assert(board.rows >= 2);
    board.cols = Object.keys(rows[0]).length;
    util.assert(board.cols >=2);
    //check for square board
    util.assert(board.cols === board.rows);
    //check that all rows have same # cols
    util.assert(same_width(rows), "rows have different widths");
    board.cell = board.width / board.rows;
    board.data = [];
    //convert to 2D array from array of objects
    for(var i = 0; i < rows.length; i++){
      var row_obj = rows[i];
      var cols = Object.keys(row_obj).length;
      var row_arr = [];
      for(var j = 0; j < cols; j++){
        var key = j.toString();
        util.assert(key in row_obj);
        var code = row_obj[key]; 
        util.assert(util.is_string(code));
        util.assert(code.length === 2);
        row_arr.push(code);
      }
      board.data.push(row_arr);
    }
  }

  function to_index(row, col){
    return row * board.rows + col;
  }

  function same_width(rows){
    var width = Object.keys(rows[0]).length;
    return rows.every(function(r){ return Object.keys(r).length === width; }); 
  }

  function get_goal(color, symbol){
    util.assert(Array.isArray(board.goals), "non-array passed to get_goal()");
    return board.goals.find(function(g){
      return (g.symbol === symbol) && (g.color === color);
    });
  }

  function polyfill(){
    if (!Array.prototype.find) {
      Array.prototype.find = function(predicate) {
        if (this == null) {
          throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return value;
          }
        }
        return undefined;
      };
    }
  }
});//end module

/* NOTES
 * a state is a set of robots [and a board + a goal]
 * each state points to its predecessor
 * a new state must be distinct from its predecessors predecessor (no reversals)
 * when the goal state is reached, return 
 *
 * for heuristic: use dijkstra's distance from goal robot to goal
 * will always be less than straight walk distance
 * because: requires at least as many ricochets
 * state for dijkstra's: robot, goal, list of visited nodes
 * list of visited nodes prevents backtrack
 *
 * for cheap heuristic - use block walking distance (?plus walls crossed?)
 * */
