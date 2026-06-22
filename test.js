fetch('https://docs.google.com/spreadsheets/d/12lfm49QujrIANFGiV8VaaUWMtesS_EOZgBKUQIuQdPU/edit?usp=sharing').then(r => r.text()).then(t => {
  const regex = /\"([^\"]+)\",\d+\]/g;
  let match;
  while(match = regex.exec(t)) {
    console.log(match[1]);
  }
}).catch(e => console.error(e));
