function generateSolvedBoard() {
      // A valid base Sudoku solution
      const base = [
        [1,2,3, 4,5,6, 7,8,9],
        [4,5,6, 7,8,9, 1,2,3],
        [7,8,9, 1,2,3, 4,5,6],

        [2,3,4, 5,6,7, 8,9,1],
        [5,6,7, 8,9,1, 2,3,4],
        [8,9,1, 2,3,4, 5,6,7],

        [3,4,5, 6,7,8, 9,1,2],
        [6,7,8, 9,1,2, 3,4,5],
        [9,1,2, 3,4,5, 6,7,8],
      ];

      // Shuffle rows within each band of 3, and shuffle columns within each stack
      for (let band = 0; band < 3; band++) {
        const rows = [0, 1, 2].sort(() => Math.random() - 0.5);
        const extracted = base.splice(band * 3, 3);
        base.splice(band * 3, 0, ...rows.map(r => extracted[r]));
      }

      // Shuffle columns within each stack
      for (let stack = 0; stack < 3; stack++) {
        const cols = [0, 1, 2].sort(() => Math.random() - 0.5);
        for (let r = 0; r < 9; r++) {
          const extracted = base[r].splice(stack * 3, 3);
          base[r].splice(stack * 3, 0, ...cols.map(c => extracted[c]));
        }
      }

      return base;
    }

    function generatePuzzle(clues = 32) {
      const solved = generateSolvedBoard();
      // Deep copy so we keep the solution separate
      const puzzle = solved.map(row => [...row]);

      let removed = 0;
      const toRemove = 81 - clues;

      while (removed < toRemove) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (puzzle[r][c] !== 0) {
          puzzle[r][c] = 0;
          removed++;
        }
      }

      return { puzzle, solved };
    }

    // ─── State ───────────────────────────────────────────────────────

    let puzzle = [];
    let solution = [];
    let selectedCell = null;
    let selectedR = -1, selectedC = -1;

    // ─── Board Rendering ─────────────────────────────────────────────

    function buildBoard() {
      const board = document.getElementById('board');
      board.innerHTML = '';

      for (let box = 0; box < 9; box++) {
        const boxEl = document.createElement('div');
        boxEl.className = 'box';
        const boxRow = Math.floor(box / 3);
        const boxCol = box % 3;

        for (let cell = 0; cell < 9; cell++) {
          const cellEl = document.createElement('div');
          cellEl.className = 'cell';
          const r = boxRow * 3 + Math.floor(cell / 3);
          const c = boxCol * 3 + (cell % 3);
          cellEl.dataset.r = r;
          cellEl.dataset.c = c;

          const val = puzzle[r][c];
          if (val !== 0) {
            cellEl.textContent = val;
            cellEl.classList.add('given');
          }

          cellEl.addEventListener('click', () => selectCell(cellEl, r, c));
          boxEl.appendChild(cellEl);
        }

        board.appendChild(boxEl);
      }
    }

    function getAllCells() {
      return document.querySelectorAll('.cell');
    }

    function getCellAt(r, c) {
      return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }

    // ─── Selection & Highlighting ────────────────────────────────────

    function selectCell(cellEl, r, c) {
      // Clear previous highlights
      getAllCells().forEach(el => {
        el.classList.remove('selected', 'highlight');
      });

      selectedCell = cellEl;
      selectedR = r;
      selectedC = c;
      cellEl.classList.add('selected');

      // Highlight same row, column, and box
      for (let i = 0; i < 9; i++) {
        getCellAt(r, i)?.classList.add('highlight');
        getCellAt(i, c)?.classList.add('highlight');
      }

      // Highlight the same 3x3 box
      const boxStartR = Math.floor(r / 3) * 3;
      const boxStartC = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          getCellAt(boxStartR + dr, boxStartC + dc)?.classList.add('highlight');
        }
      }

      // Keep selected on top
      cellEl.classList.remove('highlight');
      cellEl.classList.add('selected');
    }

    // ─── Keyboard Input ──────────────────────────────────────────────

    document.addEventListener('keydown', (e) => {
      if (!selectedCell || selectedCell.classList.contains('given')) return;

      const r = parseInt(selectedCell.dataset.r);
      const c = parseInt(selectedCell.dataset.c);

      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        puzzle[r][c] = num;
        selectedCell.textContent = num;
        selectedCell.classList.add('filled');
        selectedCell.classList.remove('error');
        document.getElementById('message').textContent = '';
      }

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        puzzle[r][c] = 0;
        selectedCell.textContent = '';
        selectedCell.classList.remove('filled', 'error');
      }

      // Arrow key navigation
      const moves = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
      if (moves[e.key]) {
        e.preventDefault();
        const [dr, dc] = moves[e.key];
        const nr = Math.min(8, Math.max(0, r + dr));
        const nc = Math.min(8, Math.max(0, c + dc));
        const next = getCellAt(nr, nc);
        if (next) selectCell(next, nr, nc);
      }
    });

    // ─── Game Controls ───────────────────────────────────────────────

    function newGame() {
      const clues = parseInt(document.getElementById('diff').value);
      const result = generatePuzzle(clues);
      puzzle = result.puzzle;
      solution = result.solved;
      selectedCell = null;
      selectedR = -1; selectedC = -1;
      document.getElementById('message').textContent = '';
      buildBoard();
    }

    function checkSolution() {
      let allFilled = true;
      let allCorrect = true;

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = getCellAt(r, c);
          const val = puzzle[r][c];

          if (val === 0) {
            allFilled = false;
          } else if (!cell.classList.contains('given')) {
            if (val !== solution[r][c]) {
              cell.classList.add('error');
              allCorrect = false;
            } else {
              cell.classList.remove('error');
            }
          }
        }
      }

      const msg = document.getElementById('message');
      if (!allFilled) {
        msg.style.color = '#885500';
        msg.textContent = 'Board is not complete yet.';
      } else if (allCorrect) {
        msg.style.color = '#3B6D11';
        msg.textContent = '✓ Solved! Well done!';
      } else {
        msg.style.color = '#c0392b';
        msg.textContent = 'Some cells are incorrect.';
      }
    }

    function clearBoard() {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = getCellAt(r, c);
          if (!cell.classList.contains('given')) {
            puzzle[r][c] = 0;
            cell.textContent = '';
            cell.classList.remove('filled', 'error');
          }
        }
      }
      document.getElementById('message').textContent = '';
    }

    // ─── Start ───────────────────────────────────────────────────────
    newGame();