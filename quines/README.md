# Binaris Quine Collection

A [quine](https://en.wikipedia.org/wiki/Quine_(computing)) is a non-empty computer program which takes no input and produces a copy of its own source code as its only output.  
An [ouroboros](https://en.wikipedia.org/wiki/Ouroboros) is a serpent eating its own tail, and a recursion of the quine concept.

You'll find here two quines, one in JavaScript, and one in Python, and "one" ouroboros in JavaScript and Python.  
The quine functions will print themselves when invoked, and the ouroboros functions will print each other when invoked.

You can deploy the functions with `./deploy.sh`  
Now, either invoke the functions manually, or check they're good with `./test.sh`  
Finally, you can remove the functions with `./remove.sh`
