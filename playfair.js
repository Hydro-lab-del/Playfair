// Playfair Cipher with Encrypt/Decrypt Toggle

const keyInput = document.getElementById('key-input');
const generateMatrixBtn = document.getElementById('generate-matrix');
const matrixDiv = document.getElementById('matrix');
const textInput = document.getElementById('text-input');
const actionBtn = document.getElementById('action-btn');
const output = document.getElementById('output');
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');
const inputLabel = document.getElementById('input-label');

let playfairMatrix = null;
let encryptMode = true;

function removeDuplicate(string) {
    let result = '';
    for (const char of string) {
        if (!result.includes(char)) result += char;
    }
    return result;
}

function createMatrix(key) {
    key = key.toUpperCase().replace(/\s+/g, '').replace(/J/g, 'I');
    key = removeDuplicate(key);
    let alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
    let fullKey = key;
    for (let char of alphabet) {
        if (!fullKey.includes(char)) fullKey += char;
    }
    let matrix = [];
    let idx = 0;
    for (let row = 0; row < 5; row++) {
        matrix[row] = [];
        for (let col = 0; col < 5; col++) {
            matrix[row][col] = fullKey[idx++];
        }
    }
    return matrix;
}

function displayMatrix(matrix) {
    matrixDiv.innerHTML = '';
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.textContent = matrix[row][col];
            matrixDiv.appendChild(cell);
        }
    }
}

// Disable the button initially
generateMatrixBtn.disabled = true;

// Enable or disable the button based on key input
keyInput.addEventListener('input', () => {
    generateMatrixBtn.disabled = !keyInput.value.trim();
});

generateMatrixBtn.addEventListener('click', () => {
    playfairMatrix = createMatrix(keyInput.value);
    displayMatrix(playfairMatrix);
});

function preprocessText(text, forEncrypt = true) {
    text = text.toUpperCase().replace(/\s+/g, '').replace(/J/g, 'I');
    let digraphs = [];
    let i = 0;
    while (i < text.length) {
        let a = text[i];
        let b = (i + 1 < text.length && text[i] !== text[i + 1]) ? text[i + 1] : 'X';
        digraphs.push([a, b]);
        if (b === 'X') i++;
        else i += 2;
    }
    return digraphs;
}

function preprocessCiphertext(text) {
    text = text.toUpperCase().replace(/\s+/g, '').replace(/J/g, 'I');
    let digraphs = [];
    for (let i = 0; i < text.length; i += 2) {
        let a = text[i];
        let b = (i + 1 < text.length) ? text[i + 1] : 'X';
        digraphs.push([a, b]);
    }
    return digraphs;
}

function findPosition(matrix, char) {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            if (matrix[row][col] === char) return { row, col };
        }
    }
}

function encryptPlayfair(matrix, digraphs) {
    let encrypted = '';
    for (let [a, b] of digraphs) {
        let posA = findPosition(matrix, a);
        let posB = findPosition(matrix, b);
        if (!posA || !posB) {
            console.warn(`Character(s) not found in matrix: ${a}, ${b}`);
            continue;
        }
        if (posA.row === posB.row) {
            // Same row: shift columns to the right
            encrypted += matrix[posA.row][(posA.col + 1) % 5];
            encrypted += matrix[posB.row][(posB.col + 1) % 5];
        } else if (posA.col === posB.col) {
            // Same column: shift rows downward
            encrypted += matrix[(posA.row + 1) % 5][posA.col];
            encrypted += matrix[(posB.row + 1) % 5][posB.col];
        } else {
            // Rectangle: swap columns
            encrypted += matrix[posA.row][posB.col];
            encrypted += matrix[posB.row][posA.col];
        }
    }
    return encrypted;
}

function decryptPlayfair(matrix, digraphs) {
    let decrypted = '';
    for (let [a, b] of digraphs) {
        // Find the positions of the two characters in the matrix
        let posA = findPosition(matrix, a);
        let posB = findPosition(matrix, b);

        // Skip if either character is not found in the matrix
        if (!posA || !posB) continue;

        // If both characters are in the same row, move left (wrap around if needed)
        if (posA.row === posB.row) {
            decrypted += matrix[posA.row][(posA.col + 4) % 5];
            decrypted += matrix[posB.row][(posB.col + 4) % 5];
        } 
        // If both characters are in the same column, move up (wrap around if needed)
        else if (posA.col === posB.col) {
            decrypted += matrix[(posA.row + 4) % 5][posA.col];
            decrypted += matrix[(posB.row + 4) % 5][posB.col];
        } 
        // If characters form a rectangle, swap their columns
        else {
            decrypted += matrix[posA.row][posB.col];
            decrypted += matrix[posB.row][posA.col];
        }
    }
    return decrypted;
}

function postprocessDecryptedText(text) {
    // Remove 'X' between duplicate letters (except real Xs)
    let result = '';
    for (let i = 0; i < text.length; i += 2) {
        let a = text[i];
        let b = text[i + 1] || '';
        if (b === 'X' && (i + 2 < text.length) && a === text[i + 2]) {
            result += a;
            // skip the 'X', next is duplicate
        } else {
            result += a + (b || '');
        }
    }
    // Remove trailing 'X' if it was padding
    if (result.endsWith('X')) {
        result = result.slice(0, -1);
    }
    return result;
}

modeToggle.addEventListener('change', () => {
    encryptMode = !modeToggle.checked;
    modeLabel.textContent = encryptMode ? 'Encrypt' : 'Decrypt';
    actionBtn.textContent = encryptMode ? 'Encrypt' : 'Decrypt';
    inputLabel.textContent = encryptMode ? 'Plaintext:' : 'Ciphertext:';
    output.textContent = '';
});

actionBtn.addEventListener('click', () => {
    if (!playfairMatrix) {
        alert('Please generate the matrix first.');
        return;
    }
    let text = textInput.value.trim();
    if (!text) {
        alert('Please enter text to process.');
        return;
    }
    // Clear output before processing
    output.textContent = '';
    let digraphs = encryptMode ? preprocessText(text, true) : preprocessCiphertext(text);
    let result = encryptMode ? encryptPlayfair(playfairMatrix, digraphs) : decryptPlayfair(playfairMatrix, digraphs);
    if (!encryptMode) {
        result = postprocessDecryptedText(result);
    }
    // Sanitize the result to prevent potential XSS attacks
    output.textContent = result.replace(/[&<>"']/g, function (char) {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[char];
    });
});
