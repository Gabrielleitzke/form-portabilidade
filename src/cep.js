const cache = new Map();
export async function lookupCep(cep, signal) {
 if (!/^\d{8}$/.test(cep)) throw new Error('Informe um CEP com 8 dígitos.');
 if (cache.has(cep)) return cache.get(cep);
 const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
 if (!response.ok) throw new Error('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
 const data = await response.json();
 if (data.erro) throw new Error('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
 if (typeof data.localidade !== 'string' || typeof data.uf !== 'string') throw new Error('Consulta indisponível. Preencha o endereço manualmente.');
 const result = {address:[data.logradouro, data.bairro].filter(Boolean).join(', '),city:`${data.localidade} / ${data.uf}`};
 cache.set(cep,result);
 return result;
}
