// Heuristic evaluation function
function evaluateBoard(board, weights) {
    let almostcompleteLines = 0;
    let maxHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;
    let density = 0;
    let upperRowNum = 0;
    let rowBelowUpper = 0;
    let row2layers = 0;
    let columnHeights = new Array(nx).fill(0);
    
    for (let y = 0; y < ny; y++){
        cnt = 0;
        empty = true;
        for (let x = 0; x < nx; x++){
            if (board[x][y] !== 0){
                empty = false;
                cnt ++;
            }
        }
        if (!empty){
            upperRowNum = cnt;
            if (y + 1 >= ny){
                rowBelowUpper = 10;
            }
            else {
                for (let x = 0; x < nx; x++){
            
                if (board[x][y+1] !== 0){
                    rowBelowUpper += 1;
                }
            }
            if (y + 2 >= ny){
                row2layers = 10;
            }
            else {
                for (let x = 0; x < nx; x++){
            
                if (board[x][y+2] !== 0){
                    row2layers += 1;
                }
            } 
        }
        }
        break;
    }
    }

    function ch(x, y){
        if (x >= 0 && y >= 0 && x < nx && y < ny && board[x][y] !== 0){
            density += 1;
        }
    }

    // density
    for (let y = 0; y < ny; y++){
        for (let x = 0; x < nx; x++){
            if (board[x][y] != 0){
                ch(x-1, y-1); ch(x-1, y); ch(x-1, y+1);
                ch(x, y-1);   ch(x, y+1);
                ch(x+1, y-1); ch(x+1, y); ch(x+1, y+1);
            }
        }
    }
    density = density / (nx * ny);

    // column heights
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                columnHeights[x] = ny - y;
                if (columnHeights[x] > maxHeight)
                    maxHeight = columnHeights[x];
                break;
            }
        }
    }

    // almost complete lines
    for (let y = 0; y < ny; y++) {
        let complete = 0;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) { complete -= 1; break; }
        }
        if (complete >= -1) almostcompleteLines++;
        if (complete == 0) completeLines ++;
    }

    // holes
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) blockFound = true;
            else if (blockFound) holes++;
        }
    }

    // bumpiness
   for (const x of [0, 1, 8, 9]) {
    const h = columnHeights[x];
    let penalty = 0;

    if (x <= 1) {
        for (let x2 = x + 1; x2 < nx; x2++) {
            if (columnHeights[x2] > h) {
                penalty = columnHeights[x2] - h;
                break;
            }
        }
    } else {
        for (let x2 = x - 1; x2 >= 0; x2--) {
            if (columnHeights[x2] > h) {
                penalty = columnHeights[x2] - h;
                break;
            }
        }
    }

    bumpiness += penalty;
}

    const featVals = [
        almostcompleteLines ,
        completeLines,
        holes,
        bumpiness,
        maxHeight,
        density,
        upperRowNum,
        rowBelowUpper,
        row2layers
    ];

    let score = 0;
    for (let i = 0; i < weights.length; i++)
        score += featVals[i] * weights[i];

    return score;
}

// Function to deep copy the blocks array
function copyBlocks(blocks) {
    let new_blocks = [];
    for (let x = 0; x < nx; x++) {
        new_blocks[x] = [];
        for (let y = 0; y < ny; y++) {
            new_blocks[x][y] = blocks[x][y];
        }
    }
    return new_blocks;
}

// Generate all possible moves for the current piece
function getPossibleMoves(piece) {
    let moves = [];
    // For each rotation of the piece
    for (let dir = 0; dir < 4; dir++) {
        piece.dir = dir;
        // For each horizontal position
        for (let x = 0; x < nx - piece.type.size; x++) {
            let y = getDropPosition(piece, x);
            let new_blocks = copyBlocks(blocks);
            eachblock(piece.type, x, y, piece.dir, function(x, y) {
                new_blocks[x][y] = piece.type;
            });
            moves.push({piece: piece, x: x, y: y, board: new_blocks});
        }
    }
    return moves;
}

// Select the best move based on heuristic evaluation
function selectBestMove(piece, weights) {
    let moves = getPossibleMoves(piece);
    let bestMove = null;
    let bestScore = -Infinity;
    moves.forEach(move => {
        let score = evaluateBoard(move.board, weights);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    return bestMove;
}

// Function to get the drop position of the piece
function getDropPosition(piece, x) {
    let y = 0;
    while (!occupied(piece.type, x, y + 1, piece.dir)) {
        y++;
    }
    return y;
}



//beam search 
function beamSearchMove(current, next, weights, depth = 2, k = 30) {

  // --- helpers ---
  function copyBoard(board) {
    const nb = new Array(nx);
    for (let x = 0; x < nx; x++) {
      nb[x] = new Array(ny);
      for (let y = 0; y < ny; y++) nb[x][y] = board[x][y];
    }
    return nb;
  }

  function occupiedOn(board, type, x, y, dir) {
    let hit = false;
    eachblock(type, x, y, dir, (bx, by) => {
      if (bx < 0 || bx >= nx || by < 0 || by >= ny || board[bx][by]) hit = true;
    });
    return hit;
  }

  function getDropPositionOn(board, piece, x) {
    let y = 0;
    while (!occupiedOn(board, piece.type, x, y + 1, piece.dir)) y++;
    return y;
  }

  function setBlockOn(board, x, y, type) {
    board[x] = board[x] || [];
    board[x][y] = type;
  }

  function removeLinesOn(board) {
    let cleared = 0;
    for (let y = ny - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < nx; x++) if (!board[x][y]) { full = false; break; }
      if (full) {
        cleared++;
        for (let yy = y; yy >= 0; yy--)
          for (let x = 0; x < nx; x++)
            board[x][yy] = (yy === 0) ? 0 : (board[x][yy - 1] || 0);
        y++;
      }
    }
    return cleared;
  }

  function simulateMove(board, piece, x, dir, weights) {
    const p = { type: piece.type, dir };
    const nb = copyBoard(board);
    const y = getDropPositionOn(nb, p, x);
    eachblock(p.type, x, y, p.dir, (bx, by) => setBlockOn(nb, bx, by, p.type));
    const cleared = removeLinesOn(nb);
    const s = evaluateBoard(nb, weights);
    const total = s + cleared * 10000;
    return { board: nb, score: total, cleared };
  }

  function getPossibleMoves(board, piece) {
    const moves = [];
    for (let dir = 0; dir < 4; dir++) {
      for (let x = 0; x <= nx - piece.type.size; x++) {
        if (!occupiedOn(board, piece.type, x, 0, dir))
          moves.push({ x, dir });
      }
    }
    return moves;
  }

  const startBoard = copyBoard(blocks);
  const curPiece = { type: current.type, dir: current.dir };
  let bestImmediate = null;

  for (let dir = 0; dir < 4; dir++) {
    const p = { type: curPiece.type, dir };
    for (let x = 0; x <= nx - p.type.size; x++) {
      if (occupiedOn(startBoard, p.type, x, 0, p.dir)) continue;

      const nb = copyBoard(startBoard);
      const y = getDropPositionOn(nb, p, x);
      eachblock(p.type, x, y, p.dir, (bx, by) => {
        if (bx >= 0 && bx < nx && by >= 0 && by < ny) nb[bx][by] = p.type;
      });

      let cleared = 0;
      for (let yy = ny - 1; yy >= 0; yy--) {
        let full = true;
        for (let xx = 0; xx < nx; xx++) {
          if (!nb[xx][yy]) { full = false; break; }
        }
        if (full) cleared++;
      }

      if (cleared > 0) {
        const ev = evaluateBoard(nb, weights);
        if (
          !bestImmediate ||
          cleared > bestImmediate.cleared ||
          (cleared === bestImmediate.cleared && ev > bestImmediate.eval)
        ) {
          bestImmediate = { x, dir: p.dir, cleared, eval: ev };
        }
      }
    }
  }

  if (bestImmediate) {
    console.log(` Immediate clear move chosen (cleared=${bestImmediate.cleared})`);
    return { x: bestImmediate.x, dir: bestImmediate.dir };
  }

  let beam = [{
    board: startBoard,
    piece: curPiece,
    score: evaluateBoard(startBoard, weights),
    firstMove: null
  }];

  for (let d = 0; d < depth; d++) {
    const nextBeam = [];
    for (const node of beam) {
      const moves = getPossibleMoves(node.board, node.piece);
      for (const m of moves) {
        const sim = simulateMove(node.board, node.piece, m.x, m.dir, weights);
        nextBeam.push({
          board: sim.board,
          score: sim.score,
          firstMove: node.firstMove || { x: m.x, dir: m.dir },
          piece: next || node.piece
        });
      }
    }
    nextBeam.sort((a, b) => b.score - a.score);
    beam = nextBeam.slice(0, k);
    if (beam.length === 0) break;
  }

  return beam[0]?.firstMove || null;
}
