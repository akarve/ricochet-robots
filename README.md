# ricochet-robots
javascript solver and visualization for ricochet robots

# status
work in progress; see notes in js/main.js on how i plan to implement search algorithms

#running
In the root directory

     http-server -pPORT

or

     python -mSimpleHTTPServer

Then visit `http://localhost:PORT` in your browser.


# file formats
a  board configuration `foo` consists of 3 files in `./data`:
* `foo.csv`
    * Boards are typically 16x16
    * File header is 0-indexed column numbers
    * Every square (or cell) on the board is reprsented by two numbers, indicating whether or not there is a wall right or bottom, respecitvely (assuming a top-down perspective with cell (0,0) in the upper left)
        * `00` no wall right, no wall bottom
        * `01` no wall right, wall bottom
        * `10` wall right, no wall bottom
        * `11` wall right and wall bottom 
* `foo.goals.json`
    * dictionaries of meta-data on goal squares (where the robots are headed)
* `foo.robots.json`
    * dictionaries of meta-data on robot color, position
