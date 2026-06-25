export type CupomTipo = "percentual" | "fixo";

export type ValidarCupomRequest = {
  codigo: string;
  total: number;
};

export type ValidarCupomValido = {
  valido: true;
  codigo: string;
  tipo: CupomTipo;
  desconto: number;
  total_final: number;
};

export type ValidarCupomInvalido = {
  valido: false;
  erro: string;
};

export type ValidarCupomResponse = ValidarCupomValido | ValidarCupomInvalido;

export function isValidarCupomValido(
  data: ValidarCupomResponse
): data is ValidarCupomValido {
  return data.valido === true;
}
