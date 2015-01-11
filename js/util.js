/*
 * Assert
 * inspired by http://stackoverflow.com/questions/15313418/javascript-assert
 */
define(function(){
  return{
    assert: function(condition, message){
      if(!condition){
        message = message || "Assertion failed";
        if(typeof Error !== "undefined")
          throw new Error(message);
        else
          throw message;
      }
    },
    key_count: function(obj){
      return Object.keys(obj).length;
    },
    wrap: function(){
      var args = Array.prototype.slice.call(arguments);
      return "(" + args.join(" ") + ")";
    },
    is_string: function(str){
      return typeof str === 'string';
    }
  };
});
