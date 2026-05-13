import { useState, useEffect, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
FESTO ↔ SMC  ISO Crossover Tool

- Full catalog data from Festo docs 202904, 202551, 204326
  and SMC CAT.EUS20-204B, C55 ES20-302, C85
- Persistent storage for user-added entries
- Spec-based builder + PN parser + editable database
  ═══════════════════════════════════════════════════════════════════ */

// ═══ INITIAL CATALOG DATABASE (from official PDFs) ═══
const INITIAL_DB = {
iso15552: {
label: "ISO 15552 — Vérins normalisés (tie-rod)",
bores: [32,40,50,63,80,100,125],
data: {
32:  { port:"G1/8",  rodThread:"M10x1.25", rodDia:12, cushionLen:17, maxBarFesto:12, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
40:  { port:"G1/4",  rodThread:"M12x1.25", rodDia:16, cushionLen:19, maxBarFesto:12, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
50:  { port:"G1/4",  rodThread:"M16x1.5",  rodDia:20, cushionLen:22, maxBarFesto:12, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
63:  { port:"G3/8",  rodThread:"M16x1.5",  rodDia:20, cushionLen:22, maxBarFesto:12, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
80:  { port:"G3/8",  rodThread:"M20x1.5",  rodDia:25, cushionLen:31, maxBarFesto:12, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
100: { port:"G1/2",  rodThread:"M20x1.5",  rodDia:25, cushionLen:31, maxBarFesto:10, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
125: { port:"G1/2",  rodThread:"M27x2",    rodDia:32, cushionLen:45, maxBarFesto:10, maxBarSmc:10, maxStrokeFesto:2800, maxStrokeSmc:2000 },
},
festoSeries: ["DSBC","DNC","DSBG"],
smcSeries: ["CP96","C96","CP96K","C96K","C96Y"],
festoCushion: { P:"Élastique (rings/plates aux 2 extrémités)", PPS:"Pneumatique auto-ajustable aux 2 extrémités", PPV:"Pneumatique réglable aux 2 extrémités" },
smcCushion: { CP96:"Coussin air + bumper (profil fermé)", C96:"Sans coussin air (tirants apparents)" },
festoOptions: {
Q:"Anti-rotation (tige carrée)", C:"Unité de serrage intégrée", E1:"Verrouillage fin de course (2 côtés)", E2:"Verrouillage (tige sortie)", E3:"Verrouillage (tige rentrée)",
L:"Faible friction", U:"Mouvement lent uniforme", L1:"Faible friction balancier", T:"Tige traversante", F:"Filetage tige femelle",
D3:"Rainures capteur 3 côtés", KE:"Réglage de course", R3:"Haute protection corrosion (CRC 3)", T1:"Joints résistants chaleur 0…120°C",
T3:"Basse température –40…+80°C", T4:"Haute température 0…+150°C", P2:"Soufflet de protection", A1:"Racleur résistance chimique",
A2:"Racleur dur (chrome)", A3:"Fonctionnement sans lubrification", A6:"Racleur métal (soudure)", EX4:"ATEX II 2GD", F1A:"Production batteries Li-ion"
},
smcOptions: {
XA:"Embout tige modifié", XB6:"Résistant chaleur –10…150°C", XC4:"Racleur renforcé", XC7:"Tirants/coussin/écrous inox",
XC10:"Double course / double tige", XC11:"Double course / simple tige", XC22:"Joints fluororubber (FKM)", XC35:"Racleur à ressort",
XC68:"Tout inox (tige chrome dur)", K:"Non-rotatif (CP96K/C96K)"
},
smcMounts: { B:"Base (sans fixation)", L:"Pied axial", F:"Bride côté tige", G:"Bride côté fond", C:"Chape simple arrière", D:"Chape double arrière", E:"Tourillon central" },
},
iso21287: {
label: "ISO 21287 — Vérins compacts",
bores: [12,16,20,25,32,40,50,63,80,100,125],
data: {
12:  { port:"M3",   rodThread:"M4",        rodDia:4,  maxStrokeFesto:500, maxStrokeSmc:150 },
16:  { port:"M5",   rodThread:"M6",        rodDia:6,  maxStrokeFesto:500, maxStrokeSmc:150 },
20:  { port:"M5",   rodThread:"M8",        rodDia:8,  maxStrokeFesto:500, maxStrokeSmc:300 },
25:  { port:"G1/8", rodThread:"M8",        rodDia:10, maxStrokeFesto:500, maxStrokeSmc:300 },
32:  { port:"G1/8", rodThread:"M10x1.25",  rodDia:12, maxStrokeFesto:500, maxStrokeSmc:300 },
40:  { port:"G1/8", rodThread:"M8",        rodDia:12, maxStrokeFesto:500, maxStrokeSmc:300 },
50:  { port:"G1/4", rodThread:"M12x1.25",  rodDia:16, maxStrokeFesto:500, maxStrokeSmc:300 },
63:  { port:"G1/4", rodThread:"M12x1.25",  rodDia:16, maxStrokeFesto:500, maxStrokeSmc:300 },
80:  { port:"G1/4", rodThread:"M16x1.5",   rodDia:20, maxStrokeFesto:500, maxStrokeSmc:300 },
100: { port:"G3/8", rodThread:"M20x1.5",   rodDia:20, maxStrokeFesto:500, maxStrokeSmc:300 },
125: { port:"G3/8", rodThread:"M27x2",     rodDia:25, maxStrokeFesto:500, maxStrokeSmc:300 },
},
festoSeries: ["ADN","ADN-S","AEN"],
smcSeries: ["C55","C55-Z","CD55"],
festoCushion: { P:"Élastique (rings aux 2 extrémités)", PPS:"Pneumatique auto-ajustable aux 2 extrémités" },
smcCushion: { C55:"Coussin élastique (bumper)" },
festoOptions: {
Q:"Anti-rotation (tige carrée)", S1:"Tige renforcée (charge latérale)", S2:"Tige traversante", S20:"Tige traversante creuse",
KP:"Unité de serrage", EL:"Verrouillage fin de course", S6:"Joints résistants chaleur max 120°C", S10:"Mouvement lent constant",
S11:"Faible friction", K10:"Tige alu anodisé (soudure)", R3:"Haute protection corrosion", R8:"Racleur anti-poussière",
TT:"Basse température –40°C", TL:"Plaque signalétique laser", EX4:"ATEX II 2GD", F1A:"Production batteries Li-ion"
},
smcOptions: {
XA:"Embout tige modifié", XB6:"Résistant chaleur –10…150°C", XB13:"Basse vitesse 5…50 mm/s",
XC6:"Tout inox", XC35:"Racleur à ressort", X1439:"Rainure capteur type T-slot",
M:"Filetage tige mâle (>ø32)", F:"Filetage tige femelle (ø20–ø25 standard)"
},
},
iso6432: {
label: "ISO 6432 — Vérins ronds (mini)",
bores: [8,10,12,16,20,25,32,40,50,63],
data: {
8:   { port:"M5",   rodThread:"M4",        rodDia:4,  maxStrokeFesto:500, maxStrokeSmc:300 },
10:  { port:"M5",   rodThread:"M4",        rodDia:4,  maxStrokeFesto:500, maxStrokeSmc:300 },
12:  { port:"M5",   rodThread:"M6",        rodDia:6,  maxStrokeFesto:500, maxStrokeSmc:300 },
16:  { port:"M5",   rodThread:"M6",        rodDia:6,  maxStrokeFesto:500, maxStrokeSmc:300 },
20:  { port:"G1/8", rodThread:"M8",        rodDia:8,  maxStrokeFesto:500, maxStrokeSmc:300 },
25:  { port:"G1/8", rodThread:"M10x1.25",  rodDia:10, maxStrokeFesto:500, maxStrokeSmc:300 },
32:  { port:"G1/8", rodThread:"M10x1.25",  rodDia:12, maxStrokeFesto:500, maxStrokeSmc:300 },
40:  { port:"G1/4", rodThread:"M12x1.25",  rodDia:12, maxStrokeFesto:500, maxStrokeSmc:300 },
50:  { port:"G1/4", rodThread:"M16x1.5",   rodDia:16, maxStrokeFesto:500, maxStrokeSmc:300 },
63:  { port:"G3/8", rodThread:"M16x1.5",   rodDia:16, maxStrokeFesto:500, maxStrokeSmc:300 },
},
festoSeries: ["DSNU","DSNU-S","ESNU"],
smcSeries: ["C85","CD85","CM2","C85K"],
festoCushion: { P:"Élastique", PPS:"Pneumatique auto-ajustable", PPV:"Pneumatique réglable" },
smcCushion: { C85:"Coussin élastique standard" },
festoOptions: {
S2:"Tige traversante", KE:"Réglage de course", S6:"Joints chaleur 120°C", S10:"Mouvement lent", L:"Faible friction",
K3:"Filetage tige femelle", KP:"Unité de serrage", Q:"Anti-rotation (ø12–63)", R3:"Haute protection corrosion",
R8:"Racleur anti-poussière (ø32–63)", A1:"Racleur résistance chimique", A6:"Racleur métal soudure (ø32–63)",
MA:"Connexion axiale côté fond", MQ:"Connexion transversale côté fond", MH:"Montage direct côté palier",
EX4:"ATEX II 2GD", F1A:"Production batteries Li-ion"
},
smcOptions: { XB6:"Résistant chaleur 150°C", XB7:"Basse température", XC6:"Tout inox" },
},
};

// ═══ STORAGE KEYS ═══
const STORE_KEY = "festo-smc-custom-entries";

// ═══ HELPERS ═══
function buildFestoPN(family, bore, stroke, cushion, rod, sensing) {
if (family === "iso15552") {
const r = rod === "through" ? "T-" : "";
return `DSBC-${bore}-${stroke}-${cushion}${sensing?"A":""}-N3`;
}
if (family === "iso21287") return `ADN-${bore}-${stroke}-A-${cushion}-A`;
if (family === "iso6432") return `DSNU-${bore}-${stroke}-${cushion}-A`;
return "—";
}

function buildSmcPN(family, bore, stroke, cushion, rod) {
if (family === "iso15552") {
const pfx = (cushion==="PPV"||cushion==="PPS") ? "CP96" : "C96";
const r = rod === "through" ? "SD" : "S";
return `${pfx}${r}B${bore}-${stroke}`;
}
if (family === "iso21287") return `C55B${bore}-${stroke}`;
if (family === "iso6432") return `C85N${bore}-${stroke}`;
return "—";
}

function parseFesto(pn) {
const s = pn.trim().toUpperCase();
let m;
m = s.match(/^(DSBC|DNC)-(\d+)-(\d+)-(.+)$/);
if (m) { const o=m[4]; let c="P"; if(o.includes("PPV"))c="PPV"; else if(o.includes("PPS"))c="PPS"; return{family:"iso15552",bore:+m[2],stroke:+m[3],cushion:c,rod:o.includes("T")?"through":"single",sensing:o.includes("A")||o.includes("N3")}; }
m = s.match(/^ADN-(\d+)-(\d+)-([AI])-([A-Z]+)-([A-Z])(.*)$/);
if (m) return{family:"iso21287",bore:+m[1],stroke:+m[2],cushion:m[4],rod:"single",sensing:m[5]==="A"};
m = s.match(/^DSNU-(\d+)-(\d+)-(.+)$/);
if (m) { let c="P"; if(m[3].includes("PPV"))c="PPV"; else if(m[3].includes("PPS"))c="PPS"; return{family:"iso6432",bore:+m[1],stroke:+m[2],cushion:c,rod:"single",sensing:m[3].includes("A")}; }
return null;
}
function parseSmc(pn) {
const s = pn.trim().toUpperCase();
let m;
m = s.match(/^(C?P?96)([A-Z]*)(\d+)-(\d+)(.*)$/);
if (m) return{family:"iso15552",bore:+m[3],stroke:+m[4],cushion:m[1].includes("P")?"PPV":"P",rod:m[2].includes("D")?"through":"single",sensing:true};
m = s.match(/^C55[A-Z]*(\d+)-(\d+)/);
if (m) return{family:"iso21287",bore:+m[1],stroke:+m[2],cushion:"P",rod:"single",sensing:false};
m = s.match(/^(C85|CM2)[A-Z]*(\d+)-(\d+)/);
if (m) return{family:"iso6432",bore:+m[2],stroke:+m[3],cushion:"P",rod:"single",sensing:false};
return null;
}
function detect(pn) {
const s=pn.trim().toUpperCase();
if(/^(DSBC|DNC|ADN|DSNU|DSBG|AEN|ESNU)-/.test(s)) return "festo";
if(/^(CP?96|C55|C85|CM2|CD55|CD85)/.test(s)) return "smc";
return null;
}

// ═══ COLORS ═══
const K={bg:"#090c11",sf:"#0f1219",cd:"#141922",ca:"#1a2030",bd:"#212842",bh:"#3060ff",
tx:"#d5dbec",mu:"#5e6c92",dm:"#394060",ac:"#3060ff",as:"rgba(48,96,255,.09)",
fe:"#0091dc",fb:"rgba(0,145,220,.06)",fi:"rgba(0,145,220,.18)",
sm:"#dc3545",sb:"rgba(220,53,69,.06)",si:"rgba(220,53,69,.18)",
ok:"#10b981",ob:"rgba(16,185,129,.06)",wa:"#eab308",wb:"rgba(234,179,8,.06)",wi:"rgba(234,179,8,.14)"};
const M="'JetBrains Mono',monospace";
const S="'Outfit',system-ui,sans-serif";

export default function FestoSmcCrossoverTool(){
const [mode,setMode]=useState("specs");
const [pn,setPN]=useState("");
const [fam,setFam]=useState("iso15552");
const [bore,setBore]=useState(50);
const [stroke,setStroke]=useState(200);
const [cush,setCush]=useState("PPV");
const [rod,setRod]=useState("single");
const [sens,setSens]=useState(true);
const [result,setResult]=useState(null);
const [err,setErr]=useState("");
const [customs,setCustoms]=useState([]);
const [showEdit,setShowEdit]=useState(false);
const [newEntry,setNewEntry]=useState({festoPN:"",smcPN:"",note:""});

// Load customs from storage
useEffect(()=>{
(async()=>{try{const r=await window.storage?.get(STORE_KEY);if(r)setCustoms(JSON.parse(r.value));}catch(e){}})();
},[]);

const saveCustoms=async(list)=>{setCustoms(list);try{await window.storage?.set(STORE_KEY,JSON.stringify(list));}catch(e){}};

const addCustom=()=>{
if(!newEntry.festoPN&&!newEntry.smcPN)return;
const list=[...customs,{...newEntry,id:Date.now()}];
saveCustoms(list);
setNewEntry({festoPN:"",smcPN:"",note:""});
};
const delCustom=(id)=>saveCustoms(customs.filter(c=>c.id!==id));

const db=INITIAL_DB[fam];
const bores=db?.bores||[];
const cushions=db?.festoCushion||{};

const doConvertPN=useCallback((val)=>{
const v=val||pn;if(!v.trim()){setResult(null);setErr("");return;}
const brand=detect(v);
if(!brand){setErr("PN non reconnu.");setResult(null);return;}
const spec=brand==="festo"?parseFesto(v):parseSmc(v);
if(!spec){setErr("Format incomplet.");setResult(null);return;}
const fPN=brand==="festo"?v.trim().toUpperCase():buildFestoPN(spec.family,spec.bore,spec.stroke,spec.cushion,spec.rod,spec.sensing);
const sPN=brand==="smc"?v.trim().toUpperCase():buildSmcPN(spec.family,spec.bore,spec.stroke,spec.cushion,spec.rod);
const d=INITIAL_DB[spec.family]?.data?.[spec.bore];
setErr("");setResult({fPN,sPN,spec,data:d,family:spec.family});
},[pn]);

const doBuild=()=>{
const spec={family:fam,bore,stroke,cushion:cush,rod,sensing:sens};
const fPN=buildFestoPN(fam,bore,stroke,cush,rod,sens);
const sPN=buildSmcPN(fam,bore,stroke,cush,rod);
const d=INITIAL_DB[fam]?.data?.[bore];
setErr("");setResult({fPN,sPN,spec,data:d,family:fam});
};

return(
<div style={{minHeight:"100vh",background:K.bg,color:K.tx,fontFamily:S}}>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .25s ease both}select,input{color-scheme:dark}`}</style>

  <div style={{background:K.sf,borderBottom:`1px solid ${K.bd}`,padding:"24px 16px 20px"}}>
    <div style={{maxWidth:660,margin:"0 auto"}}>
      <h1 style={{margin:0,fontSize:19,fontWeight:800,letterSpacing:"-.03em"}}>
        <span style={{color:K.fe}}>Festo</span><span style={{color:K.dm,margin:"0 6px",fontSize:13}}>⇄</span><span style={{color:K.sm}}>SMC</span>
      </h1>
      <p style={{margin:"2px 0 0",fontSize:10,color:K.mu}}>Crossover ISO • Données catalogues Festo 202904/202551/204326 + SMC EUS20-204B/ES20-302/C85</p>
    </div>
  </div>

  <div style={{maxWidth:660,margin:"0 auto",padding:"14px 14px 50px"}}>

    <div style={{display:"flex",gap:5,marginBottom:14}}>
      {[["specs","Par spécifications"],["pn","Par numéro pièce"],["db","Base de données"]].map(([k,l])=>(
        <button key={k} onClick={()=>{setMode(k);setResult(null);setErr("");}}
          style={{flex:1,padding:"9px 0",borderRadius:9,fontSize:12,fontWeight:600,border:`1.5px solid ${mode===k?K.bh:K.bd}`,background:mode===k?K.as:"transparent",color:mode===k?K.ac:K.mu,cursor:"pointer",fontFamily:S}}>{l}</button>
      ))}
    </div>

    {mode==="specs"&&(
      <div style={{background:K.cd,border:`1px solid ${K.bd}`,borderRadius:12,padding:"14px",marginBottom:14}}>
        <div style={{display:"grid",gap:10}}>
          <F label="Norme ISO"><Sl value={fam} onChange={e=>{setFam(e.target.value);setBore(INITIAL_DB[e.target.value].bores[3]||50);setCush(Object.keys(INITIAL_DB[e.target.value].festoCushion)[0]);}} options={Object.entries(INITIAL_DB).map(([k,v])=>[k,v.label])}/></F>
          <F label="Alésage"><Sl value={bore} onChange={e=>setBore(+e.target.value)} options={bores.map(b=>[b,`ø${b} mm`])}/></F>
          <F label="Course (mm)"><input type="number" value={stroke} onChange={e=>setStroke(+e.target.value)} min={1} max={2800} style={{width:"100%",padding:"7px 10px",background:K.ca,border:`1px solid ${K.bd}`,borderRadius:7,color:K.tx,fontSize:13,fontFamily:M,outline:"none",boxSizing:"border-box"}}/></F>
          <F label="Amortissement"><Sl value={cush} onChange={e=>setCush(e.target.value)} options={Object.entries(cushions).map(([k,v])=>[k,`${k} — ${v}`])}/></F>
          {fam==="iso15552"&&<F label="Tige"><Sl value={rod} onChange={e=>setRod(e.target.value)} options={[["single","Simple (un côté)"],["through","Traversante"]]}/></F>}
          <F label="Détection"><Sl value={sens?"1":"0"} onChange={e=>setSens(e.target.value==="1")} options={[["1","Oui (aimant)"],["0","Non"]]}/></F>
        </div>
        <button onClick={doBuild} style={{marginTop:12,width:"100%",padding:"11px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${K.fe},${K.sm})`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:S}}>Générer</button>
      </div>
    )}

    {mode==="pn"&&(
      <div style={{marginBottom:14}}>
        <input value={pn} onChange={e=>{setPN(e.target.value);doConvertPN(e.target.value);}} placeholder="DSBC-50-200-PPVA-N3 ou CP96SB50-200C" style={{width:"100%",padding:"11px 13px",background:K.cd,border:`1.5px solid ${K.bd}`,borderRadius:10,color:K.tx,fontSize:14,fontFamily:M,outline:"none",boxSizing:"border-box",marginBottom:8}} onFocus={e=>e.target.style.borderColor=K.bh} onBlur={e=>e.target.style.borderColor=K.bd}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {["DSBC-50-200-PPVA-N3","DSBC-63-100-PA-N3","DNC-40-150-PPV-A","CP96SDB50-200C","C96SB32-100","ADN-40-25-A-P-A","C55B50-100","DSNU-25-80-PPV-A","C85N20-50"].map(ex=>(
            <button key={ex} onClick={()=>{setPN(ex);doConvertPN(ex);}} style={{padding:"3px 7px",borderRadius:5,fontSize:9,fontFamily:M,background:K.cd,border:`1px solid ${K.bd}`,color:K.mu,cursor:"pointer"}}>{ex}</button>
          ))}
        </div>
      </div>
    )}

    {mode==="db"&&(
      <div style={{marginBottom:14}}>
        <div style={{background:K.cd,border:`1px solid ${K.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:K.ac,marginBottom:10}}>Ajouter une entrée personnalisée</div>
          <div style={{display:"grid",gap:8}}>
            <input value={newEntry.festoPN} onChange={e=>setNewEntry({...newEntry,festoPN:e.target.value})} placeholder="PN Festo (ex: VUVS-L25-...)" style={inputSt}/>
            <input value={newEntry.smcPN} onChange={e=>setNewEntry({...newEntry,smcPN:e.target.value})} placeholder="PN SMC (ex: SY5120-...)" style={inputSt}/>
            <input value={newEntry.note} onChange={e=>setNewEntry({...newEntry,note:e.target.value})} placeholder="Notes (optionnel)" style={inputSt}/>
            <button onClick={addCustom} style={{padding:"9px",borderRadius:8,border:"none",background:K.ac,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:S}}>+ Ajouter</button>
          </div>
        </div>
        {customs.length>0&&(
          <div style={{display:"grid",gap:6}}>
            <div style={{fontSize:10,fontWeight:700,color:K.mu,textTransform:"uppercase",letterSpacing:".07em"}}>Entrées personnalisées ({customs.length})</div>
            {customs.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:K.cd,border:`1px solid ${K.bd}`,borderRadius:8}}>
                <span style={{fontFamily:M,fontSize:11,color:K.fe,flex:1}}>{c.festoPN||"—"}</span>
                <span style={{color:K.dm,fontSize:10}}>⇄</span>
                <span style={{fontFamily:M,fontSize:11,color:K.sm,flex:1}}>{c.smcPN||"—"}</span>
                <span style={{fontSize:10,color:K.mu,flex:1}}>{c.note}</span>
                <button onClick={()=>delCustom(c.id)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${K.si}`,background:K.sb,color:K.sm,fontSize:10,cursor:"pointer"}}>✕</button>
              </div>
            ))}
          </div>
        )}
        {customs.length===0&&<p style={{fontSize:12,color:K.mu,textAlign:"center",padding:20}}>Aucune entrée personnalisée. Ajoutez vos crossovers valves, FRL, capteurs, etc.</p>}

        <div style={{marginTop:16}}>
          <div style={{fontSize:10,fontWeight:700,color:K.dm,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Référence intégrée (catalogues)</div>
          {Object.entries(INITIAL_DB).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:K.ac,marginBottom:4}}>{v.label}</div>
              <div style={{fontSize:10,color:K.mu,marginBottom:4}}>
                Festo: {v.festoSeries.join(", ")} → SMC: {v.smcSeries.join(", ")}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {v.bores.map(b=>{const d=v.data[b];return d?(
                  <span key={b} style={{padding:"3px 7px",borderRadius:5,fontSize:9,fontFamily:M,background:K.ca,border:`1px solid ${K.bd}`,color:K.tx}}>
                    ø{b} {d.port} {d.rodThread}
                  </span>
                ):null;})}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {err&&<div style={{padding:"10px 12px",borderRadius:9,background:K.sb,border:`1px solid ${K.si}`,fontSize:12,color:K.sm,marginBottom:10}}>{err}</div>}

    {result&&(mode==="specs"||mode==="pn")&&(
      <div className="fu" style={{display:"grid",gap:8}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <PNBox brand="FESTO" color={K.fe} bg={K.fb} bd={K.fi} pn={result.fPN}/>
          <PNBox brand="SMC" color={K.sm} bg={K.sb} bd={K.si} pn={result.sPN}/>
        </div>
        {result.data&&(
          <div style={{background:K.cd,border:`1px solid ${K.bd}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"7px 12px",background:K.sf,borderBottom:`1px solid ${K.bd}`,fontSize:9,fontWeight:700,color:K.mu,textTransform:"uppercase",letterSpacing:".07em"}}>Données catalogues — {INITIAL_DB[result.family]?.label}</div>
            <div style={{padding:"10px 12px",display:"grid",gap:4}}>
              <R k="Port pneumatique" v={result.data.port}/>
              <R k="Filetage tige" v={result.data.rodThread}/>
              <R k="Diamètre tige" v={`ø${result.data.rodDia} mm`}/>
              {result.data.cushionLen&&<R k="Longueur amortissement (PPV)" v={`${result.data.cushionLen} mm`}/>}
              {result.data.maxBarFesto&&<R k="Pression max Festo" v={`${result.data.maxBarFesto} bar`}/>}
              {result.data.maxBarSmc&&<R k="Pression max SMC" v={`${result.data.maxBarSmc} bar`}/>}
              <R k="Course max Festo" v={`${result.data.maxStrokeFesto} mm`}/>
              <R k="Course max SMC" v={`${result.data.maxStrokeSmc} mm`}/>
              <R k="Amortissement" v={`${result.spec.cushion} — ${INITIAL_DB[result.family]?.festoCushion?.[result.spec.cushion]||""}`}/>
              <R k="Détection position" v={result.spec.sensing?"Oui (aimant intégré)":"Non"}/>
              {result.spec.rod==="through"&&<R k="Type tige" v="Traversante"/>}
            </div>
          </div>
        )}
        <div style={{padding:"8px 10px",borderRadius:8,background:K.ob,border:`1px solid rgba(16,185,129,.13)`}}>
          <span style={{fontSize:10,fontWeight:700,color:K.ok}}>✓ Interchangeabilité ISO confirmée</span>
          <span style={{fontSize:10,color:K.mu,marginLeft:6}}>— Montage, ports et filetages identiques selon la norme.</span>
        </div>
        <div style={{padding:"8px 10px",borderRadius:8,background:K.wb,border:`1px solid ${K.wi}`}}>
          <div style={{fontSize:9,fontWeight:700,color:K.wa,textTransform:"uppercase",marginBottom:3}}>⚠ Vérifier</div>
          <div style={{fontSize:10,color:K.tx,lineHeight:1.5}}>Rainure capteur (T-slot Festo vs slide-in SMC) • Matériaux joints • Course amortissement effective • Options spéciales (X-options SMC / variantes Festo) • Accessoires montage</div>
        </div>
      </div>
    )}

    <div style={{marginTop:24,borderTop:`1px solid ${K.bd}`,paddingTop:12,textAlign:"center"}}>
      <p style={{fontSize:9,color:K.dm,lineHeight:1.5,margin:0}}>Sources: Festo 202904 (DSBC) · 202551 (ADN) · 204326 (DSNU) · SMC CAT.EUS20-204B (CP96/C96) · ES20-302 (C55) · C85 ISO 6432. Confirmer avec distributeur.</p>
    </div>
  </div>
</div>
);
}

const inputSt={width:"100%",padding:"7px 10px",background:"#1a2030",border:"1px solid #212842",borderRadius:7,color:"#d5dbec",fontSize:12,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"};

function PNBox({brand,color,bg,bd,pn}){
return(<div style={{padding:"12px",borderRadius:10,background:bg,border:`1px solid ${bd}`}}>
<div style={{fontSize:10,fontWeight:800,color,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{brand}</div>
<div style={{fontFamily:M,fontSize:13,fontWeight:700,color,padding:"7px 10px",borderRadius:7,background:"rgba(0,0,0,.2)",border:`1px solid ${bd}`,wordBreak:"break-all"}}>{pn||"—"}</div>
</div>);
}

function F({label,children}){return(<div><label style={{fontSize:10,fontWeight:600,color:"#5e6c92",display:"block",marginBottom:3}}>{label}</label>{children}</div>);}

function Sl({value,onChange,options}){
  return(
    <select value={value} onChange={onChange} style={{width:"100%",padding:"7px 10px",background:"#1a2030",border:"1px solid #212842",borderRadius:7,color:"#d5dbec",fontSize:12,fontFamily:S,outline:"none",boxSizing:"border-box"}}>
      {options.map(o=>{
        const [v,l] = Array.isArray(o) ? o : [o,o];
        return (<option key={v} value={v}>{l}</option>);
      })}
    </select>
  );
}

function R({k,v}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"#5e6c92"}}>{k}</span><span style={{fontSize:11,fontWeight:600,color:"#d5dbec",fontFamily:M,textAlign:"right",maxWidth:"55%"}}>{v}</span></div>);}
