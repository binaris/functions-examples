# A small collection of self-replicating functions (Quines & Ouroboros)

A [quine](https://en.wikipedia.org/wiki/Quine_(computing)) is a non-empty computer program which takes no input and produces a copy of its own source code as its only output.  
An [ouroboros](https://en.wikipedia.org/wiki/Ouroboros) is a serpent eating its own tail, and can be thought of as a 'recursive' quine.

This collection contains two quines, one in JavaScript, and one in Python. It also contains "one" ouroboros in JavaScript and Python.
The quine functions print themselves when invoked, and the ouroboros functions print each other when invoked.

To deploy the functions use the script `./deploy.sh`  
To test the functions use the script `./test.sh`
To see the functions simply invoke them with `bn invoke quine_js`, `bn invoke quine_py`, `bn invoke ouroboros_py`, and `bn invoke ouroboros_js`.
To remove the functions use the script `./remove.sh`
