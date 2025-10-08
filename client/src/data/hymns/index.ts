import campanha from './campanha.json';
import comissao from './comissao.json';
import conjunto from './conjunto-musical.json';
import coral from './coral.json';
import criancas from './criancas.json';
import grupoJovem from './grupo-jovem.json';
import proat from './proat.json';
import uniaoAdolescentes from './uniao-adolescentes.json';

export const initialHymnData: Record<string, { titulo: string; url: string }[]> = {
  campanha,
  'comissao': comissao,
  'conjunto-musical': conjunto,
  'coral': coral,
  'criancas': criancas,
  'grupo-jovem': grupoJovem,
  'proat': proat,
  'uniao-adolescentes': uniaoAdolescentes,
};

export type InitialHymnEntry = { titulo: string; url: string };
