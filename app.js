// app.js

/*
Ideas/TODOs:
~~~~~~~~~~~~

- animation when gravity is applied, and bubble pops
- sound for bubble pop
- points (if pop 1 bubble, 1 point, 2 bubbles = 10 points, 3 or more is 1000 * (numPopped - 2) ^2)
- show score and num clicks
- keep track of num clicks
- create leaderboards based on num clicks and score
- create a hash from the generated board and use that to load (query string?)
- make mobile friendly (add touch events, viewport, etc)
*/


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;
const BUBBLE_WIDTH = 60;
const BUBBLE_HEIGHT = 60;
const COLOURS = ['black', 'blue', 'pink', 'green', 'yellow', 'red'];

/***[ state ]***/
const initialState = {
  // set by generateNewBoard()
  board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  numBubblesWide: BOARD_WIDTH,
  numBubblesHigh: BUBBLE_HEIGHT,
  boardWidth: BOARD_WIDTH * BUBBLE_WIDTH,
  boardHeight: BUBBLE_HEIGHT * BUBBLE_HEIGHT,
  // set by onResize()
  boardOffsetX: 0,
  boardOffsetY: 0,
  // set by onMouseMove()
  mousePos: { x: 0, y: 0 },
  // set by onClick()
  mouseClicked: false,
  mouseClickPos: { x: 0, y: 0 }
};
let state = Object.assign({}, initialState);
const setState = (newState) => Object.assign(state, newState);
/***[ state ]***/

// utility function
const isInBounds = (x, y) => (
  (x >= state.boardOffsetX && x <= state.boardOffsetX + state.boardWidth) &&
  (y >= state.boardOffsetY && y <= state.boardOffsetY + state.boardHeight)
);


// bubbleX and bubbleY are array indcies of state.board
const popBubble = (bubbleX, bubbleY) => {
  const { board, numBubblesHigh, numBubblesWide } = state;
  const bubbleColour = board[bubbleX][bubbleY];
  board[bubbleX][bubbleY] = 0;
  // recursively pop all connected bubbles horizontially and vertically
  // top
  if (bubbleY > 0 && board[bubbleX][bubbleY - 1] === bubbleColour) {
    popBubble(bubbleX, bubbleY - 1);
  }
  // bottom
  if (bubbleY < numBubblesHigh - 1 && board[bubbleX][bubbleY + 1] === bubbleColour) {
    popBubble(bubbleX, bubbleY + 1);
  }
  // left
  if (bubbleX > 0 && board[bubbleX - 1][bubbleY] === bubbleColour) {
    popBubble(bubbleX - 1, bubbleY);
  }
  // right
  if (bubbleX < numBubblesWide - 1 && board[bubbleX + 1][bubbleY] === bubbleColour) {
    popBubble(bubbleX + 1, bubbleY);
  }
};

const applyGravity = () => {
  const { board, numBubblesWide, numBubblesHigh } = state;
  // for each bubble from the bottom, up, check if you can move it down
  for (let y = numBubblesHigh - 2; y >= 0; y--) {
    for (let x = 0; x < numBubblesWide; x++) {
      const isBubble = (board[x][y] !== 0);
      const hasEmptySpaceBelow = (board[x][y + 1] === 0);
      if (isBubble && hasEmptySpaceBelow) {
        // move the bubble down as far as you can
        // start at the bottom and scan upwards until the current position
        let highestEmptyCell = numBubblesHigh - 1;
        while (board[x][highestEmptyCell] !== 0) highestEmptyCell--;
        board[x][highestEmptyCell] = board[x][y];
        board[x][y] = 0;
      }
    }
  }
}

const update = (ticks) => {
  const { board, mousePos, mouseClicked, mouseClickPos, boardOffsetX, boardOffsetY } = state;
  const isMousePosInBounds = isInBounds(mousePos.x, mousePos.y);
  const bubbleX = ~~((mousePos.x - boardOffsetX) / BUBBLE_WIDTH);
  const bubbleY = ~~((mousePos.y - boardOffsetY) / BUBBLE_HEIGHT);
  const isMouseOnBubble = isMousePosInBounds && board[bubbleX][bubbleY] !== 0;
  canvas.style.cursor = isMousePosInBounds && isMouseOnBubble ? 'pointer' : 'default';

  if (mouseClicked) {
    if (isInBounds(mouseClickPos.x, mouseClickPos.y)) {
      setState({ mouseClicked: false });
      // if in boundaries, divide by bubble height/width to get bubble cell
      const bubbleClickX = ~~((mouseClickPos.x - boardOffsetX) / BUBBLE_WIDTH);
      const bubbleClickY = ~~((mouseClickPos.y - boardOffsetY) / BUBBLE_HEIGHT);
      const isCellABubble = (board[bubbleClickX][bubbleClickY] !== 0);
      if (isCellABubble) {
        // use bubble cell to trigger onBubbleCLick (tbd)
        popBubble(bubbleClickX, bubbleClickY);
        applyGravity();
      }
    }
  }
};

const drawBackground = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawText = () => {
  ctx.font = '40px Arial';
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.fillText(`Pop-Bubble`, 20, 20);
};

const drawBubble = (colour, x, y) => {
  ctx.fillStyle = 'black';
  ctx.fillRect(x + 1, y + 1, BUBBLE_WIDTH - 2, BUBBLE_HEIGHT - 2);

  // only draw the ball if it's not black
  if (colour === COLOURS[0]) return;

  const halfBubbleWidth = ~~(BUBBLE_WIDTH / 2);
  const halfBubbleHeight = ~~(BUBBLE_HEIGHT / 2);
  const centerX = x + halfBubbleWidth;
  const centerY = y + halfBubbleHeight;
  ctx.beginPath();
  ctx.arc(centerX, centerY, BUBBLE_WIDTH / 2.5, 0, Math.PI * 2);
  const colourGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    BUBBLE_WIDTH / 2.5,
    x + (halfBubbleWidth / 1.75),
    y + (halfBubbleHeight / 1.75),
    1
  );
  colourGradient.addColorStop(0, colour);
  colourGradient.addColorStop(1, 'white');
  ctx.fillStyle = colourGradient;
  ctx.fill();
};

const drawBoard = () => {
  const {
    board,
    boardWidth, boardHeight,
    boardOffsetX, boardOffsetY,
    numBubblesWide, numBubblesHigh
  } = state;

  // draw a board around the field (a slightly larger rectangle);
  ctx.fillStyle = '#888';
  ctx.fillRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

  for (let y = 0; y < numBubblesWide; y++) {
    for (let x = 0; x < numBubblesHigh; x++) {
      const colourIndex = board[x][y];
      const colour = COLOURS[colourIndex];
      drawBubble(colour, boardOffsetX + x * BUBBLE_WIDTH, boardOffsetY + y * BUBBLE_HEIGHT);
    }
  }
};

const draw = (ticks) => {
  drawBackground();
  drawBoard();
  drawText();
};

const loop = (ticks) => {
  update(ticks);
  draw(ticks);
  requestAnimationFrame(loop);
};

const onResize = () => {
  // Resize the canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Calculate the board offset
  setState({
    boardOffsetX: ~~((canvas.width - state.boardWidth) / 2),
    boardOffsetY: ~~((canvas.height - state.boardHeight) / 2)
  });
};

const generateNewBoard = () => {
  const newBoard =
    new Array(BOARD_WIDTH)
      .fill()
      .map(() =>
        new Array(BOARD_HEIGHT)
          .fill()
          .map(() =>
            ~~((COLOURS.length - 1) * Math.random() + 1)
          )
      );
  setState({
    board: newBoard,
    numBubblesWide: BOARD_WIDTH,
    numBubblesHigh: BOARD_WIDTH,
    boardWidth: BOARD_WIDTH * BUBBLE_WIDTH,
    boardHeight: BOARD_HEIGHT * BUBBLE_HEIGHT,
  });
};

const onClick = ({ clientX: x, clientY: y }) => {
  setState({
    mouseClicked: true,
    mouseClickPos: { x, y }
  });
};

const onMouseMove = ({ clientX: x, clientY: y }) => {
  setState({
    mousePos: { x, y }
  });
};

const init = () => {
  // setup event handlers
  window.addEventListener('resize', onResize);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousemove', onMouseMove);
  // It is important the board be generated before resizing
  // so that it will calculate the board offset correctly
  generateNewBoard();
  onResize();
  // start the game loop
  requestAnimationFrame(loop);
};
init();
