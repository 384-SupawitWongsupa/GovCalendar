fetch('https://docs.google.com/spreadsheets/d/12lfm49QujrIANFGiV8VaaUWMtesS_EOZgBKUQIuQdPU/edit?usp=sharing').then(r=>r.text()).then(t=>{
  const match = t.match(/\["ชีตจองยานพาหนะ",(\d+)\]/);
  if(match) console.log('GID: ' + match[1]);
  else console.log('not found');
});
