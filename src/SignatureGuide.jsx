import React,{useEffect,useRef} from 'react';
import {Check,ExternalLink,X} from 'lucide-react';
export default function SignatureGuide({name,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.current.showModal();
  return()=>{document.body.style.overflow=previousOverflow;};
 },[]);
 return <dialog ref={dialog} className="signature-guide" aria-labelledby="signature-title" onCancel={onClose} onClose={onClose}>
  <div className="section-heading"><span className="download-check"><Check size={20}/></span><button autoFocus className="icon-button" aria-label="Fechar orientações" onClick={onClose}><X size={18}/></button></div>
  <h2 id="signature-title">PDF pronto. Falta a assinatura.</h2>
  <p>Envie o termo de <strong>{name}</strong> ao responsável para assinatura eletrônica, garantindo a identificação do signatário e a integridade do arquivo.</p>
  <ol>
   <li>Assine o PDF original pelo <a href="https://assinador.iti.br/" target="_blank" rel="noopener noreferrer">Gov.br <ExternalLink size={12}/></a> (conta prata ou ouro), se aceito pela operadora, ou com certificado digital ICP-Brasil.</li>
   <li>Baixe e encaminhe o <strong>arquivo assinado</strong>. Preserve esse PDF, sem editar nem usar “imprimir para PDF” depois da assinatura.</li>
   <li>Confira a assinatura no <a href="https://validar.iti.gov.br/" target="_blank" rel="noopener noreferrer">VALIDAR do ITI <ExternalLink size={12}/></a>.</li>
  </ol>
  <p className="signature-disclaimer">O download não assina o documento. Confirme com a operadora o tipo de assinatura exigido.</p>
  <button className="primary" onClick={onClose}>Entendi</button>
 </dialog>;
}
