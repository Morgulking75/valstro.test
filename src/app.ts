import { io, Socket } from "socket.io-client";
import * as readline from 'readline';
import { stdin, stdout } from 'process';
import ora from 'ora';
import chalk from 'chalk';
import { TIE } from "./spinners/TIE";
import { XWing } from "./spinners/XWing";
import { Lightsaber } from "./spinners/Lightsaber";

const spinner = ora();
const spinners = [new TIE(), new XWing(), new Lightsaber()];
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000/");
const rl = readline.createInterface({
  input: stdin,
  output: stdout
});

socket.on("connect", () => {
  console.log(`Connected: ${socket.id}`); 

  prompt();
});

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${chalk.red(err.message)}`);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});

socket.on('search', (response) => {
  spinner.stop();

  if (response.name) {
    console.log(`${chalk.green(response.name)} ${chalk.dim.gray("appeared in")} ${chalk.gray(formatMovies(response.films))}`);
  } 
  else {
    console.log(response.error);
  }

  if (response.resultCount === response.page) { 
    console.log();
    spinner.stop();  
    rl.prompt();
  }
  else {
    spinner.start(`Loading ${response.resultCount - response.page} more characters`);
  }
});

function prompt(): void {
  rl.setPrompt("What character do you want to search for (66 to quit)? ");
  rl.prompt();
  
  rl.on('line', function(line) {
      if (line === "66") {
        console.log("May the Force be with you!");
        rl.close();
      }
  
      spinner.spinner = spinners[Math.floor(Math.random() * spinners.length)];
      spinner.start(`Searching for ${line}`);

      socket.emit("search", { query: line });  
  }).on('close',function(){
      process.exit(0);
  });
}

function formatMovies(films: string): string {
  let filmArr = films.split(', ');

  switch (filmArr.length) {
    case 0:
      return "";
    case 1:
      return chalk.italic(filmArr[0]);
    case 2:
      return `${chalk.italic(filmArr[0])} and ${chalk.italic(filmArr[1])}`;
    default:
      return chalk.italic(filmArr.slice(0, -1).join(', ')) + ', and ' + chalk.italic(filmArr.slice(-1));
  }
}
