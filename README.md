# Compressor
A simple monitoring system demo that simulate the data read sequentially from a compressor machine.

## Aclarations
In order to minimize the bounch of data loaded from the csv file we olny work with a chunk of around ~177601 records. A whole load and parse system is used to process and present the data file as an Object which contains `headers` and `content` separatelly.

## Running the app
```
1. git clone git@github.com:JDonadio/compressor.git
2. cd compressor
3. npm install
4. ng serve
```
_Note: Custom port can be set using `--port` flag._

## Angular information
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.2.4.