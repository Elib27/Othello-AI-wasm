# Othello AI WASM & SolidJS

This project is an AI Othello game using TypeScript, solidJS and WASM (compiled from C).  
**You can test it here: [othello-AI-WASM](https://elib27.github.io/Othello-AI-wasm/)**

## The AI algorithm
The AI is using the minimax (negamax) algorithm, which explores the possible branches of the future moves and determines the best move according to an heuristic function, alternating between maximisation when the AI plays and minimisation when the opponent plays.  

The heuristic function is a weighted sum of the following parameters:
- the **stability** (the number of discs that can't be reversed)
- the **parity** (the difference between the number of discs of the AI and the opponent)
- the **position** (the value of the position of the discs according to the board)

## The project

For the UI, I used [SolidJS](https://www.solidjs.com/), a reactive javascript framework.  
The logic of the game is written in Typescript.  
The AI algorithm is written in C and compiled to [WASM](https://webassembly.org/) for better performance.  
The AI WASM is loaded, compiled and executed asynchronously in a Web Worker.  