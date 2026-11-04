import {test,expect} from '@playwright/test';
import {validCpf,validCnpj,documentError,identityError,formatDocument} from '../src/validation.js';
import {validate,migrateRecord,fields,fullAddress} from '../src/model.js';

test('CNPJ numérico e alfanumérico seguem os verificadores oficiais',()=>{
 for(const doc of ['12.345.678/0001-95','12345678000195','00.000.000/0001-91','12.ABC.345/01DE-35','12abc34501de35'])expect(validCnpj(doc),doc).toBe(true);
 for(const doc of ['12.345.678/0001-90','12.ABC.345/01DE-36','12.ABC.345/01DE-AA','00000000000000','11111111111111','12.ABC.345/01DÉ-35','12@ABC34501DE35','12ABC34501DE35!'])expect(validCnpj(doc),doc).toBe(false);
 expect(formatDocument('12abc34501de35')).toBe('12.ABC.345/01DE-35');
});
test('CPF e CIN validam os dois dígitos e rejeitam repetição',()=>{
 expect(validCpf('529.982.247-25')).toBe(true);
 for(const cpf of ['52998224726','11111111111','00000000000','5299822472'])expect(validCpf(cpf)).toBe(false);
 expect(documentError('52998224725')).toBe('');
 expect(identityError({rgType:'cin',rg:'52998224725'})).toBe('');
 expect(identityError({rgType:'cin',rg:'52998224726'})).not.toBe('');
});
test('RG exige UF e confere estrutura sem aplicar um DV nacional inexistente',()=>{
 for(const rg of ['12.345.678-X','MG-12.345.678','1234567890123','0012345'])expect(identityError({rgType:'rg',rgUf:'MG',rg}),rg).toBe('');
 for(const rg of ['123','11111111','ABC','1234<script>','12@345','A123456789012345'])expect(identityError({rgType:'rg',rgUf:'SP',rg}),rg).not.toBe('');
 expect(identityError({rgType:'rg',rgUf:'',rg:'12345678'})).toContain('UF');
 expect(identityError({rgType:'rg',rgUf:'XX',rg:'12345678'})).toContain('UF');
});
test('número separado obrigatório, complemento e migração de rascunhos',()=>{
 expect(validate({number:''},'number')).toContain('número');
 for(const number of ['120','120A','120-B','S/N'])expect(validate({number},'number')).toBe('');
 expect(validate({number:'qualquer coisa'},'number')).not.toBe('');
 expect(fullAddress({address:'Rua Teste, Centro',number:'120A',complement:'sala 4'})).toBe('Rua Teste, Centro, nº 120A, sala 4');
 expect(fullAddress({address:'Rua Antiga, 42, Centro',number:'42',complement:''})).toBe('Rua Antiga, 42, Centro');
 const old=migrateRecord({flowVersion:2,step:10,address:'Rua Antiga, 42'});
 expect(old.step).toBe(fields().length);expect(old.address).toBe('Rua Antiga, 42');expect(old.number).toBe('');expect(validate(old,'number')).not.toBe('');
 expect(migrateRecord({flowVersion:1,step:3}).step).toBe(4);
 expect(migrateRecord({flowVersion:2,step:5}).step).toBe(6);
 expect(migrateRecord({flowVersion:3,step:5}).step).toBe(5);
});
