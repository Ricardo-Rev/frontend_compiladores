import type * as Monaco from 'monaco-editor';

let temaRegistrado = false;

export function registrarLenguajeUmgpp(monaco: typeof Monaco) {
  const yaRegistrado = monaco.languages.getLanguages().some(l => l.id === 'umgpp');
  if (!yaRegistrado) {
    monaco.languages.register({ id: 'umgpp' });

    monaco.languages.setMonarchTokensProvider('umgpp', {
      tokenizer: {
        root: [
          [/\b(PROGRAM|BEGIN|END)\b/, 'keyword'],
          [/\.(?!\d)/, 'keyword'],
          [/\b(avanzar_mts|avanzar_ctms|avanzar_vlts|girar|circulo|cuadrado|rotar|caminar|moonwalk)\b/, 'command'],
          [/[()]/, 'paren'],
          [/-?\d+/, 'number'],
          [/;/, 'delimiter'],
        ],
      },
    });
  }

  if (!temaRegistrado) {
    monaco.editor.defineTheme('umgpp-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '4A9EFF', fontStyle: 'bold' }, // Azul — PROGRAM, BEGIN, END
        { token: 'command', foreground: '38BDF8' },                     // Celeste — instrucciones
        { token: 'paren',   foreground: '4ADE80' },                     // Verde — paréntesis
        { token: 'number',  foreground: 'F87171' },                     // Rojo — enteros
      ],
      colors: {
        'editor.background': '#0d1117',
      },
    });
    temaRegistrado = true;
  }

  monaco.editor.setTheme('umgpp-dark');
}