import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

/* ============================================================
   CRM TERRENO — Distribuidora de neumáticos y lubricantes moto
   Prototipo funcional (MVP). PC + móvil. Datos persistentes.
   ============================================================ */

/* ---------- Capa de almacenamiento (persistente + fallback) ---------- */
const mem = {};
const store = {
  async get(k) {
    if (typeof window !== "undefined" && window.storage) {
      try { return await window.storage.get(k); } catch { return null; }
    }
    return k in mem ? { key: k, value: mem[k] } : null;
  },
  async set(k, v) {
    if (typeof window !== "undefined" && window.storage) {
      try { return await window.storage.set(k, v); } catch { return null; }
    }
    mem[k] = v; return { key: k, value: v };
  },
};

function usePersistent(key, initial) {
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await store.get(key);
      if (alive && r && r.value != null) {
        try { setValue(JSON.parse(r.value)); } catch {}
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    store.set(key, JSON.stringify(value));
  }, [key, value, loaded]);
  return [value, setValue, loaded];
}

/* ---------- Constantes de negocio ---------- */
const MARCAS = [
  { n: "Ipone", t: "Lubricante", desc: "40% spray · 50% aceites" },
  { n: "Castrol", t: "Lubricante", desc: "—" },
  { n: "GT-Oil", t: "Lubricante", desc: "40%" },
  { n: "Bridgestone", t: "Neumático", desc: "30%" },
  { n: "Shinko", t: "Neumático", desc: "35%" },
  { n: "Motoz", t: "Neumático", desc: "30%" },
  { n: "Monkey", t: "Neumático", desc: "35%" },
  { n: "Obor", t: "Neumático", desc: "35%" },
  { n: "Gibson", t: "Accesorios", desc: "—" },
];

const CAT_LABELS = {
  "1": "Crédito ilimitado",
  "2": "Crédito $5.000.000",
  "3": "Crédito $3.000.000",
  "4": "Crédito $1.000.000",
  "5": "Contado",
};

/* ---------- Lista de clientes precargada (619, importada del ERP) ---------- */
const SEED_ROWS = [["4TIME SPA","77289697-2","Cliente","3","Tienda de repuestos","","Metropolitana","Santiago","Alameda 2845, Santiago, Metropolitana","Alameda 2845, Santiago, Metropolitana","","Transportadora","","CHEVALIER","DIEGO","","","56478978","Ipone",""],["ABRAHAM JOSEPH COLMENARES NIETO","26176951-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ADAN ESTEBAN CISTERNA GONZALEZ","14616260-6","Cliente","3","Tienda de repuestos","","Maule","Curico","FREIRE 709, 3, Curico, Maule","","","Retiro en tienda","","","ADAN CISTERNA","","","+56994139206","Bridgestone|Ipone|Monkey",""],["ADOLFO RODRIGO PARRAGUEZ MORENO","13500676-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["Agricola Al Sur","77281974-9","Cliente","3","Tienda de repuestos","","Metropolitana","Vitacura","AV NVA COSTANERA 4229 202, Vitacura, Metropolitana","Cadaques 538 538, Vitacura, Metropolitana","","Reparto propio","","","","","","","Monkey",""],["AGRICOLA EL AGAVE LIMITADA","77790893-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|GT-Oil|Ipone",""],["AGRICOLA EL JARDIN S.A.","76477315-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone",""],["AGRICOLA HETTICH-SMOLKO LIMITADA","76573194-1","Cliente","3","Tienda de repuestos","","Los Lagos","Purranque","FUNDO MIRAMONTE, Purranque, Los Lagos","","","Retiro en tienda","","","andres enrique hettich","","","+56 9 4275 5843","",""],["AGRICOLA QUELEN SPA","77712539-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["AGRICOLA SANTA GABRIELA DEL TRAPICHE SPA.","77336100-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["AGRICOLA Y GANADERA JOSE MIGUEL INFANTE E.I.R.L","76220878-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["AGUSTIN EGUIGUREN BUSTAMANTE","19892529-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["AGUSTIN REYES","21865182-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ALAN FERNANDO HERNANDEZ VILLEGAS","13450991-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ALBINI SPA","76768872-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ALDO GABRIEL RIQUELME ARAVENA","19129662-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["ALDO OSORIO","16207564-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56982233168","",""],["ALEJANDRO FELIX HORN ALVAREZ","16314798-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["ALEJANDRO HUMBERTO DENHAM GUTIERREZ","8331594-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Motoz",""],["ALEJANDRO JOSE DENHAM FRAUENBERG","20072983-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["ALEJANDRO MARCELO FONTAINE URIBARRI","8778740-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ALEJANDRO STUARDO","15197368-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey|Bridgestone",""],["ALEX MARCELO SOTO VASQUEZ","15680954-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["ALEX MASTER SPA","77426654-2","Cliente","3","Tienda de repuestos","","Maule","Chillan","juanito 123, Chillan, Maule","juanito 123, Chillan, Maule","","Reparto propio","","","Fabio","","","569745478","Ipone|Shinko",""],["ALEX MAURICIO MARTINEZ AVILES","16934627-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone",""],["ALLEN MOTOS SPA","76711421-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["ALLENDES MOTOS","11976738-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["ALVARO LEONEL SAEZ PIZARRO","17529032-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["AMBAR ARCE FUENTES","17096579-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["American Friction Lube Chile Spa","76933452-1","Cliente","3","Tienda de repuestos","","Metropolitana","San Joaquin","Sierra Bella 2352, San Joaquin, Metropolitana","","","Retiro en tienda","","","","","","+56972201109","Ipone",""],["ANA MARIA MEZA VERGARA","10712536-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz",""],["ANDREA VALENZUELA CARRASCO","14365112-6","Cliente","3","Tienda de repuestos","","Metropolitana","Pudahuel","Av. La Estrella 1389, Pudahuel, Metropolitana","Icla, Pudahuel, Metropolitana","","Reparto propio","","","","","","+56998300382","Ipone",""],["ANDREAS VALENZUELA ROCHE","16152102-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["ANDRES GONZALEZ","13361047-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56979654417","Bridgestone",""],["ANDRES GONZALEZ DESTERRADOS","13.361.047-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56 9 7965 4417","",""],["ANDRES JONEMANN","99789352","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56971662216","",""],["ANDRES JUNEMANN NUNEZ","9978935-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["ANGELO ALVARO GONZALEZ MALE","20035094-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ANGELO GENTA P. E.I.R.L","76976697-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone|Motoz",""],["ANGELO JAVIER SUAREZ DOSSI","15448982-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["ANTHONY JHON MOLANO VARGAS","26084597-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Shinko",""],["AN�BAL ALEJANDRO REYES AM�STICA","17458996-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ARAYA MOTOS DANILO EDUARDO SPA","77055225-7","Cliente","3","Tienda de repuestos","","Metropolitana","Maipu","AV. LOS PAJARITOS 1425, Maipu, Metropolitana","","","Retiro en tienda","","","","","","","Monkey|Ipone",""],["ARRANCANDO SPA","77441701-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ARSENIO CERDA","10052155-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["ASIA FOOD SPA","77855007-5","Cliente","3","Tienda de repuestos","","Antofagasta","Antofagasta","General Velásquez 1198, Antofagasta, Antofagasta","","","Retiro en tienda","","","","","","","",""],["AUSTRAL PRODUCCIOINES LIMITADA","77829032-4","Cliente","3","Tienda de repuestos","","Biobío","Concepción","Paicaví 2022, Concepción, Concepción, Biobío","","","Retiro en tienda","","","Nelson Parada","","","+56988831856","",""],["AUSTRAL PRODUCCIONES LTDA","77.829.032-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["AUTOMOTORA SANTA MARIA LTDA","79586200-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Shinko|Monkey",""],["AUTOMOTRIZ GONZALO CARMONA Y CIA LTDA","77231820-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["AUTOVIA CHILE LIMITADA","76014548-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Bridgestone",""],["BASTIAN ROJO","21204998-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["BEROMOTOS","76225503-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["BIG TRAIL SHOP SPA","76636099-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko",""],["BIMOTA","80738800-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["BLT CARBIKE SPA","77664862-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["BRAAAAP STORE SPA","77396345-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["BRAM MOTORCYCLE PARTS SPA","77002767-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["BRIDGESTONE CHILE S.A","93602000-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["BRONKO MOTOS SPA","77891762-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["BRUNA RACING SPA","77592179-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["BRUNO HERNANDEZ GABOR","21030755-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["Burgonz motos SPA","77.484.331-0","Cliente","3","Tienda de repuestos","","Metropolitana","Estacion Central","AV. PADRE HURTADO 295, Estacion Central, Metropolitana","","","Retiro en tienda","","","AVILIO GONZALEZ","","","+56974802389","Ipone",""],["BURGONZ MOTOS SPA","77484331-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone",""],["BYPMOTOS SPA","78213887-1","Cliente","3","Tienda de repuestos","","Metropolitana","Estación Central","Concón 19, Estación Central, Estación Central, Metropolitana","","","Retiro en tienda","","","Bastian Rojo","","","+56977594301","Ipone|Shinko|Monkey",""],["CABRINI LAZCANO SPA","76942402-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CALOTA MOTO YASSEF SELMAN EIRL","77262855-2","Cliente","3","Tienda de repuestos","Tienda","Biobío","Concepcion","Castellon 764, Concepcion, Biobío","Starken CtaCte, Concepcion, Biobío","","Reparto propio","","","Yassef Calota","","","+56 9 8229 0279","Shinko|Ipone|Motoz|Bridgestone",""],["CARLOS ABRAHAM CARDENAS RODRIGUEZ","13899013-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CARLOS ALBERTO MUNOZ MAS","7670637-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["CARLOS ALEJANDRO GUTIERREZ DAVILA","16358134-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["CARLOS ANDRES HORMAZABAL ATENAS","13945741-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CARLOS AUGUSTO ERRAZURIZ SAAVEDRA","19687212-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["CARLOS D�AZ","17442219-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["CARLOS ESTEBAN PACHECO CARRASCO","12519825-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Monkey",""],["CARLOS IGNACIO MUNOZ ARACENA","19787327-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CARLOS TEIXEIRA","48229453-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz",""],["CAROLINA YANILL ALARCON SAEZ","17171745-0","Cliente","3","Tienda de repuestos","","Maule","Linares","Januario Espinoza 1027, Linares, Maule","","","Retiro en tienda","","","FRANCISCO VALDES","","","+56 9 5018 1938","GT-Oil|Ipone|Monkey",""],["CARPAS GONI SPA","76866026-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CASA RACING CHILE LIMITADA","76800031-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Ipone",""],["CATALINA NINOSKA MICHEA SILVA","1926722-K","Cliente","3","Tienda de repuestos","Taller","Valparaíso","San Esteban","LA UNION 204, SAN ESTEBAN. LOS ANDES, San Esteban, Valparaíso","","","Retiro en tienda","","","","","","+56947846536","Bridgestone",""],["CEC SERVICES SPA","77418831-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["CENNY ALEJANDRO BILBAO PENA","21326368-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CESAR ANTONIO MILLAN SIERRAALTA","25571346-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["CESAR DUANNY BELTRAN TAPIA","15718247-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CESAR ENRIQUE OCHOA SALAZAR","27084444-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CESAR FELIPE SANDOVAL SANDOVAL","13847158-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["CESAR MAURICIO GARRIDO LAGOS","18387174-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CG MOTORS SPA","77563939-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Shinko",""],["CHRISTOPHER COLVIN GRAUSCHOPF","13056246-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CHRISTOPHER GORTAIRE","12821147-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CLAUDIA ANDREA MARTINEZ BUSTAMANTE","19130462-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CLAUDIA LUNA VASQUEZ SOTO","16107237-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey|GT-Oil|Ipone",""],["CLAUDIA ROSARIO BICHARA MUNOZ","10985517-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["CLAUDIO ANDRES CHAVEZ HERRERA","12440659-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CLAUDIO ENRIQUE OLMOS GOMEZ","14481591-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Claudio Leclerc Camus","7.6626.836-3","Cliente","3","Tienda de repuestos","","Metropolitana","Quilicura","El Juncal 240, Quilicura, Metropolitana","","","Retiro en tienda","","","","","","+56 9 39171415","Ipone|Shinko|Bridgestone|Motoz",""],["COLETTE ALICE DE RAUCOURT ROCA","7024119-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["COLMOTOS SPA","77915954-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COLOMBIA MOTOS SPA","76592427-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COLVIN Y COLVIN LTDA","53016530-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Gibson|Shinko|Monkey",""],["COM ANDRES A BARRERA VEGA EIRL","16984710-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["COMERCIAL ANDRES A BARRERA VEGA EIRL","76716645-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["COMERCIAL ASSEM MOTOS SPA.","77199506-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIAL BYD LIMITADA","76320271-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["COMERCIAL CARRERA LTDA","76269962-1","Cliente","3","Tienda de repuestos","","Valparaíso","Quilpue","CALLE SEGUNDA 0773, QUILPUE 0773, Quilpue, Valparaíso","CALLE SEGUNDA 0773, QUILPUE 0773, Quilpue, Valparaíso","","Reparto propio","","","","","","","Motoz|Shinko",""],["COMERCIAL CELA SPA","76776869-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIAL CHALECO LOPEZY DEL CAMPO LTDA","76746592-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone",""],["COMERCIAL DASCANIO LIMITADA","76071825-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["COMERCIAL E INVERSIONES ESR","76301961-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Motoz|Shinko",""],["COMERCIAL FABIAN ISMAEL AM�STICA VILLARROEL E.I.R.","77337026-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["COMERCIAL GRUNEFELD Y COMPANIA LIMITADA","76308687-9","Cliente","3","Tienda de repuestos","","Valparaíso","San Felipe","Chacabuco 277, San Felipe, Valparaíso","","","Retiro en tienda","","","Max Grunefeld","","","+56 9 92215282","Ipone",""],["COMERCIAL H SAN MARTIN SPA","77060448-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["COMERCIAL IR S.A.","76361943-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["COMERCIAL JEREMIAS LTDA","78225660-2","Cliente","3","Tienda de repuestos","","Metropolitana","Providencia","Av. Vitacura 9390, Providencia, Metropolitana","Franklin 350, Providencia, Metropolitana","","Reparto propio","","","Juan Vargas","","","+56945212284","Bridgestone|Ipone",""],["COMERCIAL LOS ARRAYANES S.A.","78871120-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["COMERCIAL LOS CIRUELOS LTDA.","78577180-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["COMERCIAL MAXI ENDURO-CROSS LIMITADA","77324089-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIAL REPUESTOS Y MOTOS FELIPE RIVAS E.I.R.L.","77533707-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIAL SANTIAGO CASAS BAEZ E.I.R.L.","76633401-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIAL TERRASSA SPA","77603979-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["COMERCIAL TOPMOTOS SPA","77296119-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Bridgestone|Ipone",""],["COMERCIAL Y SERVICIOS MOTOPARK","76272306-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["COMERCIAL Y SERVICIOS ZERO COMPRESI�N SPA","77127666-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["COMERCIALIZADORA ALEJANDRO IGNACIO LARA NEUMANN E.I.R.L.","78339811-7","Cliente","3","Tienda de repuestos","Tienda","Metropolitana","Puerto Varas","IMPERIAL 433, PUERTO VARAS 433, Puerto Varas, Metropolitana","CACEM, Puerto Varas, Metropolitana","","Reparto propio","","","AÑEJANDRO LARA","","","+56 9 6444 8832","Motoz",""],["COMERCIALIZADORA DE PIEZAS Y ACCESORIOS PARA MOTOA","77900826-6","Cliente","3","Tienda de repuestos","","","Macul","pedro de valdivia 5691 local 3, macul 3, Macul","","","Retiro en tienda","","","","","","","Shinko|Bridgestone|Motoz",""],["COMERCIALIZADORA E IMPORTACIONES GUERRERO Y RODRIA","77237395-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIALIZADORA E IMPORTADORA MOTOPRO LIMITADA","76404446-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["COMERCIALIZADORA ECB SPA","77307227-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIALIZADORA EL OLIMPICO SPA","77362754-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIALIZADORA EMILIO JOSE SPA","78133178-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIALIZADORA FABIAN TOLEDO GUERRERI E.I.R.L","78123462-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["COMERCIALIZADORA FLORES, URBINA Y YENTZEN LIMITADA","78123408-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["COMERCIALIZADORA GM ASOCIADOS SPA","76935453-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIALIZADORA HENRY ALFONSO PATI�O WYSOCKI E.I.","77225399-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey|Ipone",""],["COMERCIALIZADORA MARJORIE EVELYN RODRIGUEZ MUNITA E.I.R.L","76563989-1","Cliente","3","Tienda de repuestos","","Antofagasta","Antofagasta","Uribe 636 1008 antofagasta, Antofagasta, Antofagasta","","","Retiro en tienda","","","MACMILLAN","","","+56988993610","Bridgestone",""],["COMERCIALIZADORA MOTOSPORT SPA","77842486-K","Cliente","3","Tienda de repuestos","","O'Higgins","San Fernando","Calle Tres Montes 780, San Fernando 780, San Fernando, O'Higgins","","","Retiro en tienda","","","MARIANO SOLAR","","","+56 9 9873 5969","Ipone|Shinko",""],["COMERCIALIZADORA MOTOURING CHILE LTDA","76942440-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["COMERCIALIZADORA MUNDO TUNING SPA","78007721-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["COMERCIALIZADORA ROSALES Y LOPEZ LIMITADA","77649747-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Comercializadora Sianomoto Spa","78285058-k","Cliente","3","Tienda de repuestos","","Metropolitana","La Florida","Av. Concha y Toro 3097, La Florida, Metropolitana","","","Retiro en tienda","","","Luciano Medina","","","+56939560539","Ipone",""],["COMERCIALIZADORA SUMINISTROS ANDINOS SPA","78032493-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMERCIO CARLOS ALBERTO PARRA ZAPATA E.I.R.L","76485453-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["COMPANIA DE EFICIENCIAS Y LABORES AGRICOLAS","76376508-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","Valeria Cornejo","","","+56 9 3261 5199","Gibson|Ipone|Monkey",""],["CONSTANZA ISLAVIA MIRANDA CANCINO","16910364-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CONSTRUCTORA BRICENO Y CIA LTDA","87867400-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["CONSTRUCTORA VB SPA","77958108-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CRHISTIAN GABRIEL JAYMEZ QUI�ONES","8659222-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["CRISTIAN ALEJANDRO ESPEJO MERCADO","15024867-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["CRISTIAN ALEJANDRO LOO VERDEJO","19486032-3","Cliente","3","Tienda de repuestos","Tienda","Valparaíso","Limache","Republica 101, Limache, Valparaíso","Vayve, Limache, Valparaíso","","Reparto propio","","","Cristian Loo","","","+56964812704","Bridgestone|Gibson|Ipone|Shinko",""],["CRISTIAN CORNEJO AHUMADA","14546611-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Monkey",""],["CRISTIAN LARRAIN REYES","10844186-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Motoz",""],["CRISTIAN LENGERICH VALDERRAMA","8433342-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CRISTIAN MARCELO HUEICHA JIMENEZ","18281822-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["CRISTIAN ROGEL","14098073-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["CRISTOBAL HERNAN CARRASCO URZUA","20164871-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["CRISTOBAL MOMARES","13669924-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone",""],["CRISTOBAL PRIETO","20827318-3","Cliente","3","Tienda de repuestos","","","","LAS HUALTATAS 4334, DEPTO 301","","","Retiro en tienda","","","","","","+56965963478","Bridgestone",""],["CUADERNOSCL SPA","77722303-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone|Motoz",""],["CURAUMA MOTOS SPA","77999691-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["CV MOTOS SPA","76466652-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Shinko|Monkey",""],["CVC NAUTICA SUR SPA","77367675-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["D&P MOTO RACING LIMITADA","76983515-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["DAMIAN HERRERA","21698211-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["DANIEL ALFREDO ALVARADO MAR�N","17160248-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["DANIEL ISRAEL GONZALEZ CONCHA","18527854-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["DARIO MARTINEZ","13472884-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["DARWIN CAMPOS ESCOBEDO","16389984-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["DARWIN CORTEZ","12394988-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["DATA IMPACT BUSINESS SOLUTIONS SPA","78000816-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Ipone",""],["DIEGO ANTONIO HERNANDEZ SALAZAR","18350398-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["DIEGO FELIPE PRADENAS GUERRERO","18098403-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["DIP MOTO","76534560-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["DISTRIBUIDORA CHILENA DE MOTOCICLETAS S A","96993820-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko",""],["DISTRITHUNDER SOLUCIONES SPA","76972592-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone",""],["DOBLE CILINDRO SPA","77.142.749-9","Cliente","3","Tienda de repuestos","","Metropolitana","La Florida","AV. TRINIDAD ORIENTE 175, La Florida, Metropolitana","","","Retiro en tienda","","","ESTEBAN","","","+56971792986","Ipone",""],["DYNO RACING","77241978-3","Cliente","3","Tienda de repuestos","","","Macul","Avda Macul 4394, Macul","","","Retiro en tienda","","","Jose Luis Leon","","","+56 9 79094448","Ipone|Bridgestone",""],["EASY RIDER MOTORSHOP SPA","76868187-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["EDUARDO ANDRES BENTJERODT VASQUEZ","10812118-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["EDUARDO ANTONIO VALENCIA ZAMORANO","12900267-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["EL CHEMA SPA","77880477-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ELITE MOTOS","77518702-6","Cliente","3","Tienda de repuestos","","Metropolitana","Santiago","Chiloe 1980, Santiago Centro 1980, Santiago, Metropolitana","","","Retiro en tienda","","","Elite Motos","","","+56 9 3461 3809","Ipone",""],["ELIZABETH CAREN PENA LETELIER","16375730-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["ELSIE ALFARO ALFONSO","14720151-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["EMAGBMX CIA LTDA","76226101-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56 9 6248 2885","Ipone|Motoz|Shinko",""],["EME MOTOS SPA","77407524-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["EMILIO GABRIEL VEGA MEZA","13045524-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["ENDUMOTOS MR SPA","77518156-7","Cliente","3","Tienda de repuestos","","Metropolitana","Colina","EL ALBA 3 PARCELA 35, Colina, Metropolitana","","","Retiro en tienda","","","MATIAS","","","56936828980","Ipone|Motoz|Bridgestone|Shinko",""],["ENDURO PRO SPA","76497111-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Motoz",""],["EQUIPOS Y EXPEDICIONES LIMITADA","76618478-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["ERIC FERNANDO ALDARET RAMIREZ","18285763-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ESR MOTOS (NO USAR)","6271057-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Motoz",""],["Esteban Aburto","19410184-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["ESTEBAN ANDRES SAN MARTIN OCAMPO","19481365-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["EUGENIO HERNAN JIMENEZ SOLIS","13345907-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey",""],["EXTINTORES MAURICIO VALENZANO REYES E.I.R.L","76733099-5","Cliente","3","Tienda de repuestos","Tienda","O'Higgins","Santa Cruz","GONZALO BULNES 45,5 45,5, Santa Cruz, O'Higgins","VILCHES, Santa Cruz, O'Higgins","","Reparto propio","","","","","","","Bridgestone|Ipone|Shinko|Monkey",""],["EXTREMOTO COMPRA Y VENTA DE REPUESTOS LUBRICANTP","76090078-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Bridgestone",""],["FABIO LEONARDO SAID RODOVALHO","18160949-4","Cliente","3","Tienda de repuestos","","Metropolitana","Santiago","Alonso de Cordova 5045, 1204, Santiago, Metropolitana","STARKEN, Santiago, Metropolitana","","Reparto propio","","","","","","","",""],["FACTORY STORE SPA","77382854-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Felipe Andr�s Jodorkovsky Ventura","18640996-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["FLAVIO SILVA","17029193-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["FLO CABRERA","78362549-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56973409487","Bridgestone",""],["FOXER MOTORS SPA","78242306-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["FRANCISCA ANGEL RODRIGUEZ","18982216-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone",""],["FRANCISCO EDUARDO ARAYA MORAGA","18056467-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["FRANCISCO JAVIER ANGEL ARAYA","17828353-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["FRANCISCO MAURICIO GUZMAN SEPULVEDA","10219263-K","Cliente","3","Tienda de repuestos","","Biobío","Los Angeles","Galvarino 355, Los Angeles, Biobío","","","Retiro en tienda","","","Francisco Mauricio Guzman","","","56 9 98473216","Ipone|Shinko|Monkey",""],["FRANCO PETROWITSCH LOPEZ","19690068-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Monkey",""],["FRITZ MOTOSTORE SPA","77132766-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey|Ipone",""],["FUENZALIDA LARRAIN SPA","77190996-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Shinko",""],["FUNDACION REINVENTARSE","65070018-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["FUNTEC SERVICIOS SPA","76366613-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GABRIEL BALUT GALEB","17117419-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["GABRIEL PAREDES GALLARDO","21837107-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56986922691","",""],["GALGA PUBLICIDAD SPA","77828727-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["GB MOTORSPORT SPA","78016947-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["GC INVERSIONES SPA","77717091-0","Cliente","3","Tienda de repuestos","Tienda","","Macul","Exequiel Fernández 2995, Macul, Chile 2995, Macul","","","Retiro en tienda","","","Noel","","","+56 9 3705 7246","Bridgestone|Gibson|Ipone|Motoz|Shinko|Monkey",""],["GERARDO ANTONIO VALDES ABARCA","9814852-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Monkey",""],["GERMAIN CASTILLO MARIN","13807030-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GERMAN EDUARDO VARAS CASTRO","15091273-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone",""],["GERMAN LYON","12232474-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GERMANIA SPA","77047847-2","Cliente","3","Tienda de repuestos","","Metropolitana","Independencia","AV. FERMIN VIVACETA 761, Independencia, Metropolitana","","","Retiro en tienda","","","","","","","Ipone",""],["GLENN ALEX BURNS DACRE","6692529-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["GONZALO DAVID TORRES CASTILLO","18350932-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GONZALO NICOLAS HINOJOSA CASTILLO","16767234-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GONZALO SEBASTI�N VALENZUELA FUENTES","13306027-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GOUET Y COMPANIA LIMITADA","76101129-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["GRIP ZONE COMERCIALIZADORA SPA","77418648-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GRUPO ANDINA INVERSIONES SPA","77263833-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["GR�FICA MAGUILA LIMITADA","76289893-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Monkey",""],["GUILLERMO ANDRES TORRES ULLOA","13341657-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Monkey",""],["GUNAPURNA SPA","77383771-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz",""],["GUSTAVO ADOLFO SOTO REYES","16701723-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["GUSTAVO ORELLANA","15722012-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["GYP MOTOS","76401911-3","Cliente","3","Tienda de repuestos","","Biobío","Concepcion","Paicavi 1924, Concepcion, Biobío","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko|Monkey",""],["HECTOR ANER OGAZ ROJAS COMERCIAL EIRL","76798367-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["HECTOR ANTONIO RAMIREZ VASQUEZ","12607745-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko",""],["HECTOR HERNAN PARADIS BARRIENTOS","10320285-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Motoz",""],["HENRY ALEXIS OJEDA LEIVA","17657561-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["Henyumak motos spa","77856806-3","Cliente","3","Tienda de repuestos","Tienda","Tarapacá","Antofagasta","Edmundo Pérez Zujovic 7330 7330, Antofagasta, Tarapacá","","","Retiro en tienda","","","HENRY BERENGUELA","","","+56 9 8254 2870","",""],["HENYUMAK MOTOS SPA","77856806-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["HERENCIA RIDES SPA","77044799-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["HERNAN ANDRES ALVAYAY JOERGES, TALLER PARA VEHICUL","76124823-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Motoz|Monkey",""],["HERNAN FERREIRA PRODUCCIONES SPA","76255968-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Shinko",""],["HERWIN ERNESTO VARAS GARRIDO","12401209-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["HIGH QUALITY MOTORS LIMITADA","76553045-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["HIPERMARC S. A.","96621750-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["HONDA MOTOR DE CHILE SA","96870620-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Gibson|Motoz|Shinko",""],["HPPLUS SPA","76868912-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["HUASO CHOPPERS SPA","77233881-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["I.E.F. CHILE SPA","76014315-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IGNACIO ALFONSO FUENTEALBA TORRES","19597920-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IGNACIO CORTES","19767572-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["IGNACIO MUÑOZ RIVAS MOTOS EIRL","76605847-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["IMPORTADORA ATV-STORE SPA","76978355-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["IMPORTADORA CORSE SPA","76923897-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56229553061","Ipone",""],["IMPORTADORA DOFREX STORE SPA","77381017-6","Cliente","3","Tienda de repuestos","","Metropolitana","Lo Espejo","PEDRO ADOLFO LOPEZ MATEO 01951, Lo Espejo, Metropolitana","","","Retiro en tienda","","","SANDY","","","+56964674554","Ipone",""],["IMPORTADORA GLOBALPJ SPA","78137004-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IMPORTADORA OXS LIMITADA","76224568-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IMPORTADORA TODOMOTO SPA","76084100-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["IMPORTADORA Y COMERCIALIZADORA CAR DETAILING SPA","77305502-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IMPORTADORA Y COMERCIALIZADORA GALLARDO PARRAGUEZA","76809382-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["IMPORTADORA Y COMERCIALIZADORA LUIS  LEYTON CORREA","76442896-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["IMPORTADORA Y DISTRIBUIDORA DE REPUESTOS VIWIS SPA","77530813-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IMPORTADORA Y DISTRIBUIDORA DE REPUESTOS WILLIAMS","78077926-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["IMPORTADORA Y DISTRIBUIDORA VIGA MOTOS SPA","76776166-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["ingenieria y construcciones innos spa","76853703-8","Cliente","3","Tienda de repuestos","","Metropolitana","Providencia","nueva providencia 1860, of 32, Providencia, Metropolitana","","","Retiro en tienda","","","","","","+56973878542","Motoz|Ipone",""],["INGENIER�A Y DISTRIBUCI�N SPA","78226621-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["INSUMOS DE MOTO VALENTINA MORA E.I.R.L.","77430046-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["INVERMOTO SPA","77114811-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["INVERSIONES DUQUE SPA","77281917-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["INVERSIONES MADEVA SPA","76956326-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56963943103","Ipone",""],["INVERSIONES MAGUILA SPA","77907465-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone|Motoz|Shinko",""],["INVERSIONES MCLAP SPA","77308067-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["Inversiones nyl spa","77584158-3","Cliente","3","Tienda de repuestos","","Metropolitana","Cerro Navia","Av. Salvador Gutierrez 6378, Cerro Navia, Metropolitana","","","Retiro en tienda","","","Juan","","","+56920433047","Ipone",""],["Inversiones NYL Spa","77.584.158-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56920433047","",""],["INVERSIONES PEÑALOZA SPA","78218196-3","Cliente","3","Tienda de repuestos","","Metropolitana","La Florida","SANTA RAQUEL 10252|, La Florida, Metropolitana","","","Retiro en tienda","","","DAVID PEÑALOZA","","","+56950764182","Ipone",""],["INVERSIONES PERRO H-D SPA","77157869-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["INVERSIONES PK SPA","77671455-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["INVERSIONES SM SPA","77560419-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["INVERSIONES VALKIRIA SPA","76791216-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Monkey",""],["Inversiones y Comercializadora R&R SPA","77.312.825-1","Cliente","3","Tienda de repuestos","","O'Higgins","San Fernando","Bernardo O´higgins 116 Local 11, San Fernando, O'Higgins","","","Retiro en tienda","","","Rodrigo Peña","","","+56 9 89478668","Ipone",""],["INVERSIONES Y LOG�STICA FL SPA","77062939-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["INVERSIONES Y TRANSPORTES XC LIMITADA","76052973-7","Cliente","3","Tienda de repuestos","","Metropolitana","Maipu","VICENTE REYES 650, MAIPU, Maipu, Metropolitana","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Monkey|Motoz|Gibson|Shinko",""],["INVERSIONES Y&M SPA","76963913-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["INVERSIONES ZONA ENDURO SPA","77440947-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["ISAYI MOTORBIKE SPA","77502575-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["IVAN ALEXIS ZEPEDA ARANCIBIA","16400916-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Monkey",""],["IVAN FEDIUNIN","48226093-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["IVANIA AIDA ECHEVERRIA CONTRERAS","16077987-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JACOB B�EZ GONZ�LEZ E.I.R.L.","77273637-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JACQUELINE DEL PILAR TOLEDO NUNEZ","9175533-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone",""],["JAIME ANDRES ARMENGOLLI FERRER","12868667-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["JAPO MOTO","77952876-6","Cliente","3","Tienda de repuestos","","Metropolitana","Quilicura","Av. Lo Marcoleta 192, Quilicura, Metropolitana","","","Retiro en tienda","","","","","","+56965348791","Ipone",""],["JAPO MOTOS","77.952.876-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+569 65348791","Ipone",""],["JAVIER ALBERTO SOTO VIVANCO","17165840-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JAVIER ALEJANDRO PALACIOS AVILA","15815022-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["JAVIER ALEJANDRO RIGUERO DEMIERRE","17266205-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JAVIER ANDRES COLLAO SICKERT","16210197-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["JAVIER IGLESIS BUCHANAN","8132280-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JAVIER IGNACIO ESPINA ROSSEL","16129060-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko",""],["JAVIER ORTIZ","10823402-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56994232018","Ipone",""],["JAVIER SANTIAGO VALENZUELA CORDERO","19135355-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JAVIERA VALENTINA VERA VALDIVIA","17703095-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JCJ SOLUTIONS SPA","78338133-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56987335287","Bridgestone",""],["JEAN ALEXANDER ANWANDTER BRAUN","7620965-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JEAN DANIEL CISTERNAS PEREZ","18688833-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JEAN PAUL CASTRO CORNEJO","15400906-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JEREMY BENJAMIN LORCA CANUI�IR","20971832-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JJ MOTOPARTS SPA","77983842-0","Cliente","3","Tienda de repuestos","","Metropolitana","La Cisterna","Santa Clara 18 L.18, La Cisterna, Metropolitana","","","Retiro en tienda","","","Jose","","","+569 27350451","Monkey|Ipone",""],["JJR MOTOS CHILE SPA","76970106-0","Cliente","3","Tienda de repuestos","","Metropolitana","Santiago","Doctor Brunner 630, Santiago, Metropolitana","","","Retiro en tienda","","","JESSICA","","","+56 936401886","Shinko",""],["JOAQUIN MU�OZ","21225370-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JONATHAN DAZA","19295016-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JONATHAN EULOGIO TOBAR VALLADARES","14383383-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JORGE DANIEL RODRIGUEZ ARCIA","26976058-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["Jorge Jonathan Araneda Carrasco","17139428-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JOSE ARAUJO","26869719-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["JOSE ISAAC SALDIAS MARCHANT","15164822-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JOSE LUIS VENDER ACEVEDO","12884662-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JOSE MANUEL ROGERS","5921804-2","Cliente","3","Tienda de repuestos","","La Araucanía","Pucon","SUCURSAL PUCON, Pucon, La Araucanía","","","Retiro en tienda","","","JOSE MANUEL ROGERS","","","99047 2277","Bridgestone",""],["JUAN ANDRES ESTRADA ALFARO","15613494-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["JUAN ANTONIO ARRIAGADA STUARDO","13113885-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["JUAN CARLOS MARTINEZ MADGE","18638784-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Monkey",""],["JUAN CARLOS PITO VALDES","17212399-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56966094906","Bridgestone",""],["JUAN CRISTOBAL MOSSO KRUUSE","12853722-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JUAN EDUARDO ESTEBAN QUIROZ AHUMADA","17596962-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["JUAN ESCUDERO CALABRAN","9971189-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Motoz|Monkey",""],["JUAN FRANCISCO GOMEZ","14114444-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["JUAN GUILLERMO ESCUDERO SPA","77469077-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Motoz|Shinko|Monkey",""],["JUAN PABLO MUNOZ ESPINOZA","13600276-7","Cliente","3","Tienda de repuestos","","Maule","Linares","Avenida Ramon Olate 1006, local F -G, Linares, Maule","","","Retiro en tienda","","","","","","","",""],["JUAN PABLO NAVARRO","19503344-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["JUAN PABLO VERGARA CASTRO","10584187-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["JUAN RAUL JAQUE PASTEN","11822570-8","Cliente","3","Tienda de repuestos","","Coquimbo","Coquimbo","Avda geronimo mendez 916, Coquimbo, Coquimbo","","","Retiro en tienda","","","JUAN RAUL JAQUE PASTEN","","","56 9 9886 4974","Motoz|Ipone",""],["JUVENAL ALBERTO DIAZ NYBORG","9228854-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["KAM MOTORCYCLES SPA","78381788-8","Cliente","3","Tienda de repuestos","Taller","Metropolitana","Providencia","Av. Francisco Bilbao 583, Providencia, Metropolitana","","","Retiro en tienda","","","BASTIAN FAUNDEZ","","","+56981857882","Ipone",""],["Kaori Rodriguez","17010492-7","Cliente","3","Tienda de repuestos","","Metropolitana","La Florida","Santa Raquel 10313, La Florida, Metropolitana","","","Retiro en tienda","","","","","","+56949955143","Ipone",""],["KATHERINE DORIA","17427481-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["KAVALERA�S BIKES SPA","77940396-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone|Monkey",""],["KENDRA NAHIA IRIBARREN G�MEZ","19712752-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["KLM SPA","76780421-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["LA BALIZA MC SPA","77890215-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Ipone|Bridgestone",""],["LA CASA DE LA MOTO","14202039-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone",""],["LA CASA DE LA MOTO SPA","78236835-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["LEON MAQUINARIA LIMITADA","76433029-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56997337712","Bridgestone",""],["LEONARDO BRAVO","17026926-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["LEONARDO MORALES ALVARES","13744701-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["LOGISTICAS RAMOS SPA","77589319-2","Cliente","3","Tienda de repuestos","","","Quinta Normal","Gaspar de Orense 960, Quinta Normal 960, Quinta Normal","","","Retiro en tienda","","","JOSE RAMOS","","","+56 9 2208 1638","Bridgestone|Ipone|Shinko",""],["LOUIS ARTHUR ABD-EL KADER PEEBLES","8338156-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Shinko",""],["LUBRICENTRO G Y M SPA","78.390.414-4","Cliente","3","Tienda de repuestos","","Metropolitana","Padre Hurtado","Brasilia 2414 LB, Padre Hurtado, Metropolitana","","","Retiro en tienda","","","Eduardo Gomez M","","","56 9 54885533","Ipone",""],["LUBRICENTRO VICTOR MORA ESTEBAN VINCHENZZO VICTOR","77220478-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["LUBRICLETA SPA","77651679-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","Salvador Mundaca","","","+56991873408","Gibson|GT-Oil|Ipone|Shinko|Monkey",""],["LUBRIMOTO L.A. SPA","77348263-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["LUIS ALFREDO LYNCH VERDEJO","7412612-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["LUIS GONZALO REYES SILVA","14108656-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["LUIS HUMBERTO AREVALO RIQUELME","7053614-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["LUIS MARCHANT","18479819-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["LUIS NIBALDO FARIAS AGUILERA","11388392-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["Lyon Servicios Limitada","77092200-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","Pablo Diaz","","","+56977492704","Bridgestone|Ipone",""],["M Y R SPA","78225312-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["M Y R SPA","78.225.312-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56999416657","Bridgestone",""],["MAICO SPORT","78262780-5","Cliente","3","Tienda de repuestos","Taller","Metropolitana","Las Condes","Avda Sebastian Piñera Echeñique 807, Las Condes, Metropolitana","","","Retiro en tienda","","","Maria","","","+56 9 61082906","Ipone|Shinko",""],["MANTENCION Y REPARACION DE MOTOCICLETAS Y ACCESORO","77260696-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MANTENCI�N Y VENTA DE ACCESORIOS SEGUEL SPA","77206533-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MANUEL ALEJANDRO CASAS CORDERO PENA","12368365-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MANUEL ALEJANDRO QUIROZ BUSTOS","17694911-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MANUEL RODRIGUEZ 250","16747363-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["MARCELO ANTONIO CACERES DINAMARCA","11672779-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MARCELO DAMI�N GONZ�LEZ MADRID","22382965-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MARCO ANTONIO ROJAS SERRANO","24032934-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MARIA CECILIA","20236848-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MARIA FERNANDA GANGAS RAMIREZ","15592327-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MARIA LUISA MONTENEGRO OSORIO","15060193-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MARIO ANTONIO BARRERA VEGA","13342189-0","Cliente","3","Tienda de repuestos","","Metropolitana","Buin","Villaseca 365 lote 2-2a, Buin, Metropolitana","","","Retiro en tienda","","","Mario Barrera","","","+56993418832","Motoz",""],["MARIO BUGUE�O DIAZ","19300966-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MARISOL MONTANARI VALDES","9982568-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MARTIN ORTEGA","21764353-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MAS MOTOS SPA","77170718-1","Cliente","3","Tienda de repuestos","","Maule","Chillan","Arturo Prat 928 928, Chillan, Maule","","","Retiro en tienda","","","DIEGO","","","+56 9 7135 1518","Gibson|Shinko|Monkey|Motoz|Ipone|Bridgestone",""],["Mathias Bravo","17533423-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MATIAS ALEJANDRO ARANGUA ZELAYA","9982619-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MATIAS CERDA ALVADRO","19558527-K","Cliente","3","Tienda de repuestos","","","","BULNES 235, EL MONTE","","","Retiro en tienda","","","","","","+56953495927","Bridgestone|Motoz|Shinko|Ipone",""],["MAURICIO DONNOSO","9699160-6","Cliente","3","Tienda de repuestos","","Metropolitana","Recoleta","BELLAVISTA 231 RECOLETA, Recoleta, Metropolitana","","","Retiro en tienda","","","","","","+56990224676","Bridgestone|Motoz|Shinko|Ipone|Monkey",""],["MAURICIO LEZANO GARC�S","10810020-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","Mauricio Lezano Garcés","","","+56 9 8283 3582","Motoz",""],["MAURICIO MARCOTTI","13191578-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["MAX GALLASTEGUI","21504678-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["Maxi Moto EIRL","76.092.664-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56 9 5218 9803","",""],["MAXI MOTO EIRL","76092664-7","Cliente","3","Tienda de repuestos","","O'Higgins","Pichilemu","SAN ANTONIO 48, Pichilemu, O'Higgins","","","Retiro en tienda","","","MAX RUBIO","","","+56952189803","Bridgestone",""],["MAXIMILIANO MARCELO ALEXIS VILLAR S�EZ","21572230-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MAXIMOTOS SPA","76738413-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Ipone",""],["MCO GROUP SPA","76986714-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MECANICA GUERRA CORTES LIMITADA","77970661-3","Cliente","3","Tienda de repuestos","Taller","Metropolitana","Quilicura","AV. LO MARCOLETA 323, Quilicura, Metropolitana","","","Retiro en tienda","","","","","","","Ipone",""],["MELANI BRAVO ULGINI","9385468-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MI MOTO","76321114-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey",""],["MICHAEL CUEVAS","20962724-8","Cliente","3","Tienda de repuestos","","","","villa cipres 68 machali","","","Retiro en tienda","","","","","","+56979844465","Bridgestone|Ipone",""],["MICHAEL ELIAS GALLARDO GALLARDO","17643147-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MICHAEL THOMAS KERR MOLINA","17086563-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MIGUEL ANGEL MORALES ASTUDILLO","17761220-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["Miguel Cabrera","13389414-4","Cliente","3","Tienda de repuestos","","Biobío","Curanilahue","Arturo prat esquina Riquelme 1005, Curanilahue, Biobío","","","Retiro en tienda","","","","","","","",""],["MONKEY`S CAR SPA","76309248-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MOTO AVENTURA CENTER LIMITADA","76108299-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["MOTO CITY SPA","77842704-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTO COYOTE SPA","78193059-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTO EXHAUSTS CHILE CARLOS RODRIGO ALVARADO STUCKU","76361535-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MOTO GUERRERO SPA","77892253-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Bridgestone|Ipone|GT-Oil|Motoz",""],["MOTO LAGUNAS SPA","76942185-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["MOTO MAYOR CHILE SPA","77574665-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["MOTO REPUESTOS JJ SPA","77438614-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["MOTO REPUESTOS JJ SPA","77.438.614-9","Cliente","3","Tienda de repuestos","","Metropolitana","Pudahuel","LAGO COCHRANE 7298, Pudahuel, Metropolitana","","","Retiro en tienda","","","JOHN CAICEDO","","","+56923792393","Ipone",""],["Moto Repuestos Valencia spa","77.486.259-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56986809255","Ipone",""],["MOTO RESPUESTOS VALENCIA SPA","77486259-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTO STOP","7963758-0","Cliente","3","Tienda de repuestos","","Biobío","Los Angeles","Mendoza 815, Los Angeles, Biobío","","","Retiro en tienda","","","Manuel Gurierrez","","","56 9 96823985","Ipone|Shinko|Monkey",""],["MOTO UNO CHILE SPA","76840755-K","Cliente","3","Tienda de repuestos","","Metropolitana","La Florida","Maria Cristina 6729, la Florida sn, La Florida, Metropolitana","","","Retiro en tienda","","","INGRID","","","+56940566647","Ipone|Shinko",""],["MOTO87 SPA","78184478-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["MOTOACCESORIO SPA","77509014-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["MOTOCLINIC RACING SPA","77602491-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["MOTODREAMS SPA","78008974-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTOG SPA","77479475-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTOLAB CHILE SPA","78002593-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTORCITY SPA","77177015-0","Cliente","3","Tienda de repuestos","Tienda","Tarapacá","Antofagasta","Cap. Carlos Condell 1916, Antofagasta, Tarapacá","","","Retiro en tienda","","","Nickol","","","+56 9 3017 7151","Ipone|Shinko",""],["MOTOREPUESTOS JOEL CORTES Y COMPA�IA LTDA.","76899768-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Bridgestone",""],["MOTORZONE CHILLAN SPA","78318622-5","Cliente","3","Tienda de repuestos","Tienda","Ñuble","Chillan","ECUADOR 744, Chillan, Ñuble","PUDAHUEL, Chillan, Ñuble","","Reparto propio","","","JUAN NAVARRO","","","56989732282","Ipone",""],["MOTOS DEL MAULE SPA","76481096-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Shinko",""],["MOTOS INOSTROZA SPA","77542768-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Shinko",""],["MOTOS KUPER","76352244-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["MOTOS OSSES","9023960-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Shinko",""],["MOTOS Y ACCESORIOS JUAN LUIS ESCUDERO ESCOBAR E.I.","76313093-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["MOTOSBLOTT SPA","77178489-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Motosport San Fernando spa","77804926-0","Cliente","3","Tienda de repuestos","","O'Higgins","San Fernando","Calle Tres Montes 780, San Fernando, Región del Libertador General Bernardo O'Higgins, Chile 780, San Fernando, O'Higgins","","","Retiro en tienda","","","DON MARIANO","","","+56998735969","",""],["mototematicos","8933193-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56997119549","Bridgestone",""],["MPRO COMPANY SPA","78099703-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MQX","76196119-5","Cliente","3","Tienda de repuestos","Tienda","Los Lagos","Puerto Varas","IMPERIAL 433, PUERTO VARAS 433, Puerto Varas, Los Lagos","TRANSPORTES CACEM, Puerto Varas, Los Lagos","","Reparto propio","","","ALEJANDRO LARA","","","+56 9 6444 8832","Motoz",""],["MRMOTOSCHILE SPA","77673631-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["MULTISERVICIOS ASA SPA","77789344-0","Cliente","3","Tienda de repuestos","","Metropolitana","Recoleta","Av, Recoleta 3296, Recoleta, Metropolitana","","","Retiro en tienda","","","ANTHONY","","","+56962059894","Ipone",""],["MULTISERVICIOS EL VARON SPA","78269092-2","Cliente","3","Tienda de repuestos","Tienda","Metropolitana","Santiago","Avenida Portugal 1387 1387, Santiago, Metropolitana","","","Retiro en tienda","","","DUEÑO","","","+56 9 3299 9784","Ipone|Monkey",""],["MULTISERVICIOSWMR SPA","77395108-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["MUNDO ATV CHILE","76605948-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["NACIONAL MOTOS","76498865-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["Nelson Godoy","17644445-2","Cliente","3","Tienda de repuestos","","Atacama","Vallenar","Freire #2172 Pbl. Rafael Torreblanca, Vallenar, Atacama, Vallenar, Atacama","","","Retiro en tienda","","","","","","+56 9 8172 5326","",""],["NEUMATICOS MYB SPA","77855118-7","Cliente","3","Tienda de repuestos","","Biobío","Concepcion","Las Heras 431, Concepcion 431, Concepcion, Biobío","","","Retiro en tienda","","","HUGO","","","+56 9 7609 2108","Bridgestone|Monkey|Ipone|Shinko",""],["NEUMATICOS Y LOGISTICA OMP SPA","77737009-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Shinko|Monkey",""],["NICOLAS GONZALEZ","18220392-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["NICOLS LAIBE","77948411-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["NILTON RODRIGO URBINA CARVACHO","14530955-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["OBRAS CIVILES CLAUDIA CUADRA SANDOVAL E.I.R.L.","77032201-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["OHANNES MARTIN AKEL OBERPAUR","16098081-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["OLIVER MARCELO SANCHEZ MONCADA","27171937-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["OMR NEUM�TICOS SPA","77306655-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["OSCAR EDUARDO RAMIREZ MARTINEZ","18997663-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["OSUE ISMAEL CORREA GONZ�LEZ","18165204-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PABLO AGUSTIN LEVALLE MORENO","18932637-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["PABLO ANDRES AHUMADA ESPINOZA","16224271-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["PABLO BALVOA","19347218-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["Pablo Diaz","12721204-k","Cliente","3","Tienda de repuestos","","Metropolitana","Providencia","Los tulipanes 4521 404, Providencia, Metropolitana","","","Retiro en tienda","","","Pablo Diaz","","","+56977492704","Motoz|Bridgestone|Ipone|Shinko",""],["PABLO ESTEBAN ASTUDILLO PAVEZ","13468394-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["PABLO LEVALLE","8540794-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["PABLO PAREDES ISLA","10439030-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["PARADISE MOTORS SPA","77798191-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PARQUE GUAY GUAY SPA","77945729-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["PATRICIA ALEJANDRA DONOSO ALFARO","14253540-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PATRICIO ANDRES ESTAY SILVA","16591682-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["PAULINA ARAYA FERNANDEZ","15049921-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PAULO VENTURA","17408138-7","Cliente","3","Tienda de repuestos","","Metropolitana","Las Condes","LOS ALPES 916, DEPTO 1006. LAS CONDES, Las Condes, Metropolitana","","","Retiro en tienda","","","","","","+56972156244","Gibson",""],["PEDRO GARCIA","17962012-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["PEDRO HERNAN JAIME GODOY","12446923-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["PEDRO HERNAN PEREZ ALFARO","15034367-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["PELLEGRINO SERVICE SPA","77201444-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["PEPE YAMAHA","8071254-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["PISTONS SPEED MATIAS IGNACIO OTAROLA VEJAR E.I.R..","77904791-1","Cliente","3","Tienda de repuestos","","Biobío","Concepcion","Avda Pedro de Valdivia 525, Concepcion, Biobío","","","Retiro en tienda","","","Matias","","","+56 999402545","Bridgestone|Shinko|Ipone",""],["PISTONS SPEED STORE LIMITADA","78343415-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PRO ACTION","8148757-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz",""],["PRO-TECH SPA","76973065-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["PRODUCCIONES DE EVENTOS RAVIDA Y ANDRIS LIMITADA","76207619-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["PRORIDER SPA","77556225-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone",""],["PUNTOUP SPA","77835032-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["QUINTAVI LIMITADA","77254637-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["R MOTOS SPA","76060172-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["R&O MOTOCICLETAS SPA","77231094-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Ipone",""],["RAFAEL IGNACIO PARRA ALARC�N","20102533-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["RAIMUNDO LANTE DELLA ROVERE MOLINARE","17405132-1","Cliente","3","Tienda de repuestos","","","Lo Barnechea","AV VALLE DEL MONASTERIO 2121, CASA 8, LO BARRNECHEA CASA 8, Lo Barnechea","","","Retiro en tienda","","","","","","+56926360526","Bridgestone",""],["RAUL PIZARRO GONZALEZ","20529486-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RAYMUNDO ALBERTO HERRERA GALLARDO","19421080-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Monkey",""],["RCARS CHILE SPA","78186124-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["REBIKE SPA","76593259-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RENE FRANCISCO CABANA GALLEGUILLOS","16052799-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["RENT AND COMPANY SPA","77027986-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RENTAL AUTOS Y EQUIPOS LIMITADA","77625375-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["RENTEK SPA","76860501-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko|Ipone",""],["RENZO EDUARDO ARELLANO TORO","12807769-3","Cliente","3","Tienda de repuestos","","Valparaíso","Quilpue","LOS CARRERA 0635, Quilpue, Valparaíso","","","Retiro en tienda","","","RENZO ARELLANO","","","+56982193292","Bridgestone|Gibson|Ipone|Motoz|Shinko|Monkey",""],["Reparación y Mantención de Vehículos Motorizados y Venta de Repuestos","13.899.013-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56983752699","",""],["REPARACI�N MAQUINARIAS ANNE CECILIA BRAVO SANCHEZ.","76952009-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["REPUESTOS ITALO JORGE GALASSO VALDIVIA E.I.R.L.","78070123-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["REPUESTOS QUILIN SPA","78036714-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["REPUESTOS Y ACCESORIOS DINAMITA MOTOS SPA","77322205-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey|Ipone",""],["REPUESTOS Y ACCESORIOS FENIX MOTOS","78037411K","Cliente","3","Tienda de repuestos","","Metropolitana","La Pintana","Santa Rosa 12980 Local 31, La Pintana, Metropolitana","","","Retiro en tienda","","","Nicolas","","","+56936211549","Ipone",""],["RICARDO BAYER","13282248-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["RICARDO ESTEBAN LEON FONTOVA","13550916-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone",""],["RICHARD FELIPE ARAVENA ARRIAGADA","19436689-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RIDE CHILE","76121594-9","Cliente","3","Tienda de repuestos","","Metropolitana","La Reina","ALCALDE FRANCISCO DOMINGUEZ, La Reina, Metropolitana","","","Retiro en tienda","","","ANDRES","","","","Motoz|Shinko|Bridgestone|Ipone",""],["RIDE SERVICE SPA","77308462-9","Cliente","3","Tienda de repuestos","","Ñuble","Chillan Viejo","Barboza 701, Chillan Viejo, Ñuble","","","Retiro en tienda","","","Cristian","","","+56 9 52301761","Ipone",""],["RIDER ZONE SPA","77045326-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Monkey",""],["RINO MOTOS","76153258-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Bridgestone|Ipone|Motoz",""],["RIOS Y RIOS SPA","77060998-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RODRIGO ALBERTO ROJO DE LA VEGA","12214084-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["RODRIGO ANDRES CAMPOS CAMPBELL","10564904-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Motoz",""],["RODRIGO ENRIQUE GONZALEZ PIZARRO","15908680-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["RODRIGO GUILLERMO TRONCOSO PROHARAM","12691267-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["RODRIGO NICOLAS MOLINA GONZALEZ","16888003-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["RODRIGO YA�EZ","76169097-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["ROMASA SPA","76821966-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["ROMEZ MOTO PARTS","78.158.084-8","Cliente","3","Tienda de repuestos","","Metropolitana","Maipu","BELARMINO OSORIO 63, Maipu, Metropolitana","","","Retiro en tienda","","","","","","+56962611121","Ipone",""],["ROMEZ MOTO PARTS SPA","78158084-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Ronaldo Fuentealba","20865979-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["ROSA VERONICA ORTEGA PERRY","9153839-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["ROXY VILLARONGA EQUIPO RAP","78247123-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["ROYAL MOTO SERVICE SPA","77060758-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Bridgestone|Monkey",""],["RUY BARBOSA","77530690-4","Cliente","3","Tienda de repuestos","","Metropolitana","Providencia","BUSTAMANTE 695 695, Providencia, Metropolitana","","","Retiro en tienda","","","KEVIN MUÑOZ","","","+56 9 6897 0262","Bridgestone|Ipone|Shinko|Monkey",""],["SANTELICES VILCHES REPUESTOS Y ACCESORIOS VEHICULARES LTDA","77379719-6","Cliente","3","Tienda de repuestos","","Metropolitana","Huechuraba","AV. PEDRO FONTOVA  6742, Huechuraba, Metropolitana","","","Retiro en tienda","","","AILIN","","","+56944757888","Ipone",""],["SANTIAGO MOTORS SA","76039854-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SANTIAGO MOTORS SA","76.039.854-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56982886532","Bridgestone",""],["SANTIAGO PEREZ","22532569-3","Cliente","3","Tienda de repuestos","","Metropolitana","Vitacura","POLO MANQUEHUE 4 50, Vitacura, Metropolitana","","","Retiro en tienda","","","","","","+56985673705","",""],["SBO MANTENCIONES Y REPARACIONES SPA","77289544-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["SCV ASESORIAS SPA","77076931-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Bridgestone",""],["sebastian agusto","16.877.350-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SEBASTIAN ALBORNOZ PE�A","20525443-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["Sebastian Correa","18895232-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SEBASTIAN EUGENIO MARQUEZ DE LA PLATA LARRAIN","17702967-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SEGURIDAD TRANCURA TRAPEN LIMITADA","77632878-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["SERGIO VILLARONGA TORO","13899167-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SERVICIO DE TRANSPORTES TEERRE SPA","77553039-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone|Shinko|Monkey",""],["SERVICIO GARAGEONLINE SPA","76490698-5","Cliente","3","Tienda de repuestos","","Metropolitana","Renca","Av el retiro 1227, 132, Renca, Metropolitana","","","Retiro en tienda","","","Sebastián","","","+56935551377","Bridgestone|Gibson|Ipone|Motoz|Shinko",""],["SERVICIO TECNICO AUTOMOTRIZ PATRICIA RAM�REZ HANAU","76726272-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["SERVICIO TECNICO DE VEHICULOS CEFERINO SEGUEL SPA","77150932-0","Cliente","3","Tienda de repuestos","","Tarapacá","Antofagasta","AV ARGENTINA 2979 2979, Antofagasta, Tarapacá","","","Retiro en tienda","","","","","","","Shinko",""],["SERVICIO Y COMERCIAL AV SPA","77933629-8","Cliente","3","Tienda de repuestos","","Metropolitana","Vitacura","ALEJANDRO SERANI NORTE 9458, VITACURA 1108, Vitacura, Metropolitana","","","Retiro en tienda","","","","","","","Bridgestone|Monkey|Ipone",""],["SERVICIOS AGRICOLAS MYG SPA","77870348-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["SERVICIOS ALEJANDRO KUSCHEL ANDRADE EMPRESA INDIVI","76222629-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Shinko|Monkey",""],["SERVICIOS AUTOMOTORES PEDRO ANTONIO VIVEROS MAURE.","77761457-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SERVICIOS BRUNO HERNANDEZ GABOR E.I.R.L","78174604-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SERVICIOS BRUNO HERNANDEZ GABOR E.I.R.L","78.174.604-5","Cliente","3","Tienda de repuestos","","Metropolitana","Lo Barnechea","CAMINO LA HUALA 5015 CASA 17, LO BARNECHEA, Lo Barnechea, Metropolitana","","","Retiro en tienda","","","","","","+56974787712","Bridgestone|Gibson|Ipone|Monkey|Obor|Shinko|Motoz",""],["SERVICIOS DE INGENIERIA Y MAQUINARIA RIO TRUFUL HA","76997964-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["SERVICIOS DE REPARACION Y MANTENCION INTEGRAL DE O","76326809-8","Cliente","3","Tienda de repuestos","","Metropolitana","Recoleta","VICTOR CUCCUINI 593, Recoleta, Metropolitana","","","Retiro en tienda","","","Adrian Manzur","","","983419083","Gibson|Ipone",""],["SERVICIOS GERBAUD SPA","78231274-K","Cliente","3","Tienda de repuestos","","","","ALMIRANTE PASTENE 185 OF 310 3P NULL PROVIDENCIA","","","Retiro en tienda","","","","","","+56954131530","Bridgestone",""],["SERVICIOS TOTALES PATRICIO REITZE SPA","77133262-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["SERVICIOS Y REPUESTOS FELIPE GUEVARA E.I.R.L.","76687013-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Shinko",""],["SERVIMOTORS STORE SPA","77139503-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko|Monkey",""],["SERVITECA C�SAR GARRIDO SPA","78108802-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SHANGRILA SPA","77389122-2","Cliente","3","Tienda de repuestos","Tienda","Metropolitana","Santiago","Avenida Vitacura 9315, Santiago, Metropolitana","starken, Santiago, Metropolitana","","Reparto propio","","","Ignacio Valdes","","","+56 9 9000 8548","Bridgestone|Motoz|Ipone|Gibson|Shinko|Monkey",""],["SHERIDES SPA","77937804-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SILVIA CAROLINA RIVEROS FUENTES ACCESORIOS S/R E..","76280359-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SOC COMERCIAL E INVERSIONES FERIMOTOS LIMITADA","76232490-3","Cliente","3","Tienda de repuestos","Tienda","Metropolitana","Santiago Centro","LIRA 675, Santiago Centro, Metropolitana","","","Retiro en tienda","","","MICHEL","","","+56 995313974","Ipone",""],["SOC COMERCIAL OFICINTA LIMITADA","79702500-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["SOC. COM. SOLUCION ACTIVA LTDA.","76156877-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SOCIEDAD 4 RIDER SPA","77612404-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Shinko",""],["SOCIEDAD COMERCIAL MARQUEZ SPA","77152847-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["SOCIEDAD COMERCIAL STAR OIL LIMITADA","76943779-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["SOCIEDAD DE INVERSIONES FRC MOTOSPORE LTDA","77679232-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko",""],["SOCIEDAD DE PROCESAMIENTO DE MADERAS SAN PEDRO LIM","76220394-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["SOCIEDAD DE VENTA DE ART�CULOS DEPORTIVOS SANKAYU","76947205-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SOCIEDAD EXPORTADORA VALLE DEL LIMARI LIMITADA","77041853-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Monkey|Gibson",""],["SOCIEDAD IBACACHE-VINOLY LIMITADA","76164969-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["SOCIEDAD MEJIA SPA","76653556-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|Ipone",""],["SOCIEDAD MOTOAVENTURA LTDA","77463360-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Motoz|Shinko",""],["SOCIEDAD MOTOS JV LTDA.","76429577-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Ipone|Motoz|Shinko",""],["SOCIEDAD TOLEDO Y TOLEDO LIMITADA","77546771-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["SOCIEDAD TURISTICA ADVPATAGONIA SPA","78075803-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Stephanie","18903990-5","Cliente","3","Tienda de repuestos","","Magallanes","Punta Arenas","Francisco Roux 0338, Punta Arenas, Magallanes","","","Retiro en tienda","","","","","","","",""],["STUNTBARS SPA","78144277-1","Cliente","3","Tienda de repuestos","","","La Reina","Los Herreros 8752, La Reina","","","Retiro en tienda","","","Guillermo","","","56993959004","Ipone",""],["STUNTHOUSE SPA","77427699-8","Cliente","3","Tienda de repuestos","","Metropolitana","La Reina","LOS EBANISTAS 8532, LA REINA, La Reina, Metropolitana","","","Retiro en tienda","","","WALTER","","","+56988032436","Ipone|Monkey",""],["TALLER DE MOTOCICLETAS CESAR RAFAEL CARPIO GARCIA.","77880966-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["TALLER IGUANA MOTOS LIMITADA","76491838-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["TALLER IRON CAGE SPA","77942411-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["THE CLANDESTINO GARAGE SPA","77890627-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone|Motoz|Shinko|Ipone|Monkey",""],["TODOLED SPA","77794535-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["TOMAS COOPER","20999947-1","Cliente","3","Tienda de repuestos","","","Vitacura","Las hualtatas int 5415 depto 66 Región Metropolitana de Santiago Vitacura 5415, Vitacura","","","Retiro en tienda","","","TOMAS COOPER","","","+56982218794","Shinko",""],["TONINO MOTOS","78978250-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["TOP RACING MOTORBIKE SPA","78124301-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Monkey",""],["TRACK MOTO CHILE SPA","77060107-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["TRAIL STORE","76839761-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56957383853","Bridgestone",""],["TRANSPORTE PROCARGO SPA","77331717-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["TRANSPORTE Y EVENTOS INFANTILES OMAR ISAAC VALLEJI","76421886-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["TRANSPORTES KAP LIMITADA","76190855-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["TRANSPORTES MUÑOZ SPA","77441818-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["TRANSPORTES MUÑOZ SPA TECNIMOTOS","77.441.818-0","Cliente","3","Tienda de repuestos","Taller","Metropolitana","Conchali","NAHUELBUTA 1794, Conchali, Metropolitana","","","Retiro en tienda","","","","","","+56947062025","Ipone",""],["TRANSPORTES Y REPUESTOS TOWER SPA","77990891-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["TRANSTIERRA SPA","76662899-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson|GT-Oil|Ipone|Shinko",""],["TRINIDAD SPA","77601828-7","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["TRISECA MINING SPA","76694544-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["TRX CHILE INVERSIONES LIMITADA","76701802-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56988800262","",""],["UTVPRO SPA","77445482-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko|Monkey",""],["VBNMEXPRESS SPA","77993366-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["VENEGAS ROJAS SPA","77819156-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VENTA REPUESTOS DE MOTOCICLETAS PAMELA ANDREA RIO.","77381831-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone|Shinko",""],["VENTAS REP Y ACC Y MANTENCION VEHICULOS ALEJANDRO ALBERTO IBAÑEZ MORAN E.I.R.L.","78.366.761-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","+56933664896","",""],["VENTAS REP. Y ACC. Y MANTENCION VEHICULOS ALEJANDRO ALBERTO IBAÑEZ MORAN EIRL","78366761-4","Cliente","3","Tienda de repuestos","","Metropolitana","Pudahuel","AV. TENIENTE CRUZ 69, Pudahuel, Metropolitana","","","Retiro en tienda","","","","","","+56933664896","Ipone",""],["VENTAS Y SERVICIOS A47STORE SPA","78111322-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["VICENTE ANDRES CAMPOS DIAZ DE LA VEGA","20284478-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VICENTE ANDRES COMINETTI ALLARD","19322661-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VICENTE MOTORES SPA","77008569-1","Cliente","3","Tienda de repuestos","","Valparaíso","Los Andes","Las Heras 191, Los Andes, Valparaíso","","","Retiro en tienda","","","Vicente","","","+56990356088","Ipone",""],["VICTOR ALEXIS INOSTROZA MELO","16674724-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Monkey",""],["VICTOR ANDRES BRAVO MARTINEZ","17634578-0","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["VICTOR ESTEBAN GALAZ LIZANA","19215892-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VICTOR HUGO ZABALA ZABALA","16093624-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VICTOR MANUEL POVEDA SEPULVEDA","16940075-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["VILLAGRA INGENIER�A SPA","76657662-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["VILLAGRA MOTOR SPA","77877835-1","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["VINCENT YAMIL ROJAS GONZALEZ","18278636-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["VRMOTORACING SPA","78.412.847-4","Cliente","3","Tienda de repuestos","","Metropolitana","San Ramon","PARAGUAI 1318, SAN RAMMON 0, San Ramon, Metropolitana","","","Retiro en tienda","","","YAMIL VINCENT","","","569664300990","Ipone",""],["WALTER IGNACIO FLORES MONSALVE","15657502-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["WALTER MAURICIO BRENNING","13455179-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["WILLIAM ROBERT WILFRED BUXTON HERNANDO","10969343-K","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["WILLIAM ROBERTO BUSTOS LEIVA","17448729-4","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["WILLIAMSON BALFOUR MOTORS SPA","96695420-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Bridgestone",""],["WITT Y WITT LIMITADA","76377785-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz",""],["WLACAR SPA","76625935-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","GT-Oil|Ipone|Monkey",""],["XIMENA ANDREA CANCINO HIDALGO","16480234-5","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""],["XTREAMEMOTORS SPA","78086307-2","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["YBAR GARCELAN SOTO PIZARRO","17385636-9","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Shinko",""],["YEIDER ENRIQUE NUNEZ SANDOVAL","27016169-3","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Ipone",""],["Yocars","77234007-9","Cliente","3","Tienda de repuestos","Tienda","","Quinta Normal","LOPE DE ULLOA 1799, Quinta Normal","","","Retiro en tienda","","","CARLOS","","","+56 9 85269463","",""],["YUDITH FERNANDA FIGUEROA ERICES","20095342-8","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Gibson",""],["ZAGREB SPA","76202606-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","Motoz|Shinko|Monkey|Bridgestone|Gibson|Ipone",""],["ZONA MX CHILE SPA","78383199-6","Cliente","3","Tienda de repuestos","","","","","","","Retiro en tienda","","","","","","","",""]];
function hydrateSeed(rows) {
  return rows.map((a, i) => ({
    id: "seed_" + (i + 1), vendedorId: "",
    nombre: a[0], rut: a[1], estado: a[2] || "Cliente", categoria: a[3] || "3",
    tipo: a[4] || "Tienda de repuestos", segmentos: a[5] ? a[5].split("|") : [],
    region: a[6], comuna: a[7], ciudad: "", dirComercial: a[8], dirDespacho: a[9],
    contactoDespacho: a[10], despacho: a[11] || "Retiro en tienda",
    transportadora: a[12], dirTransportadora: a[13],
    contactos: { compras: a[14], cobranzas: a[15], recepcion: a[16] },
    telefono: a[17], fotoExt: "", fotoInt: "",
    marcasPropias: a[18] ? a[18].split("|") : [], marcasComp: a[19],
    marketing: [], capacitaciones: [],
  }));
}
const SEED_CLIENTES = hydrateSeed(SEED_ROWS);


const TRANSPORTADORAS = [
  "Starken", "Chilexpress", "Pullman Cargo", "Tur Bus Cargo",
  "Correos de Chile", "Varmontt", "Cruz del Sur Cargo", "Blue Express",
];

const REGIONES = {
  "Arica y Parinacota": ["Arica", "Putre"],
  "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte"],
  "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "Mejillones"],
  "Atacama": ["Copiapó", "Vallenar", "Caldera"],
  "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio", "Quillota", "Los Andes"],
  "Metropolitana": ["Santiago", "Maipú", "Puente Alto", "La Florida", "Las Condes", "Providencia", "Ñuñoa", "San Bernardo", "Quilicura", "Pudahuel", "Estación Central", "Recoleta"],
  "O'Higgins": ["Rancagua", "San Fernando", "Rengo", "Machalí"],
  "Maule": ["Talca", "Curicó", "Linares", "Cauquenes"],
  "Ñuble": ["Chillán", "San Carlos", "Bulnes"],
  "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Chiguayante", "San Pedro de la Paz"],
  "La Araucanía": ["Temuco", "Padre Las Casas", "Angol", "Villarrica", "Pucón"],
  "Los Ríos": ["Valdivia", "La Unión", "Río Bueno"],
  "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud", "Puerto Varas"],
  "Aysén": ["Coyhaique", "Puerto Aysén"],
  "Magallanes": ["Punta Arenas", "Puerto Natales"],
};

const SEGMENTOS = ["Tienda", "Concesionario", "Taller"];
const TIPOS_CLIENTE = ["Taller multimarca", "Concesionario oficial", "Tienda de repuestos", "Otros"];
const CATEGORIAS = ["1", "2", "3", "4", "5"];
const ACCIONES_MKT = ["Activación", "Evento", "Material POP", "Letrero", "Auspicio"];
const MODOS_CAP = ["Online", "Presencial en ICLA", "Presencial en tienda/taller"];
const MOTIVOS_VISITA = ["Visita planificada", "Visita con despacho", "Despacho", "Reunión", "Activación", "Evento", "Otra"];
const TIPOS_VIAJE = ["Extranjero", "Evento", "Competencia", "Feria"];
const CARGOS = ["Vendedor en ruta", "Ejecutivo comercial", "Supervisor", "Jefe de zona", "KAM"];

/* ---------- Utilidades ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);
const fmtCLP = (n) => "$" + (Number(n) || 0).toLocaleString("es-CL");
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// Acciones pendientes del vendedor (o de toda la empresa si es admin): usado para el indicador del menú y "Mi Día".
function accionesPendientes(db) {
  const { me, clientes, visitas } = db;
  const mine = (arr, key = "vendedorId") => me.role === "admin" ? arr : arr.filter((x) => x[key] === me.id);
  const cl = mine(clientes).filter((c) => c.estado === "Cliente");
  const vs = mine(visitas);
  const visHoy = vs.filter((v) => v.estado === "Programada" && v.fecha === today());
  const realizadas = vs.filter((v) => v.estado !== "Programada");
  const conRiesgo = cl.map((c) => {
    const ult = realizadas.filter((v) => v.clienteId === c.id).map((v) => v.fecha).sort().pop();
    return { c, ult, dias: ult ? daysBetween(ult, today()) : null };
  }).filter((r) => r.dias != null && r.dias >= 15).sort((a, b) => b.dias - a.dias);
  const criticos = conRiesgo.filter((r) => r.dias >= 61);
  return { visHoy, revisitas: conRiesgo, criticos, total: visHoy.length + conRiesgo.length };
}

function mapsDir(dest) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest);
}
function whatsappUrl(tel) {
  if (!tel) return null;
  const digits = String(tel).replace(/\D/g, "");
  if (digits.length < 7) return null;
  const num = digits.startsWith("56") ? digits : digits.startsWith("9") ? "56" + digits : "56" + digits;
  return "https://wa.me/" + num;
}
function WaBtn({ tel, small }) {
  const url = whatsappUrl(tel);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={"sel-go wa" + (small ? " sm" : "")} title={"WhatsApp " + tel}>WA</a>
  );
}
function mapsMulti(stops) {
  if (!stops.length) return "https://www.google.com/maps";
  const dest = encodeURIComponent(stops[stops.length - 1]);
  const wp = stops.slice(0, -1).map(encodeURIComponent).join("|");
  let u = "https://www.google.com/maps/dir/?api=1&destination=" + dest + "&travelmode=driving";
  if (wp) u += "&waypoints=" + wp;
  return u;
}
function wazeUrl(addr, coord) {
  if (coord && coord.length === 2) return "https://waze.com/ul?ll=" + coord[0] + "," + coord[1] + "&navigate=yes";
  return "https://waze.com/ul?q=" + encodeURIComponent(addr) + "&navigate=yes";
}
function mapsEmbed(addrs) {
  const a = addrs.filter(Boolean);
  if (a.length === 0) return null;
  if (a.length === 1) return "https://maps.google.com/maps?q=" + encodeURIComponent(a[0]) + "&z=12&output=embed";
  const saddr = encodeURIComponent(a[0]);
  const daddr = a.slice(1).map(encodeURIComponent).join("+to:");
  return "https://maps.google.com/maps?saddr=" + saddr + "&daddr=" + daddr + "&output=embed";
}

/* Coordenadas aproximadas por comuna (para ordenar rutas por cercanía sin API) */
const COMUNA_COORDS = {
  "arica": [-18.4783, -70.3126], "putre": [-18.1953, -69.5591],
  "iquique": [-20.214, -70.1522], "alto hospicio": [-20.2509, -70.1108], "pozo almonte": [-20.2586, -69.786],
  "antofagasta": [-23.6509, -70.3975], "calama": [-22.4544, -68.9294], "tocopilla": [-22.092, -70.1979], "mejillones": [-23.0997, -70.449],
  "copiapo": [-27.3668, -70.3322], "vallenar": [-28.5708, -70.7581], "caldera": [-27.0667, -70.8167],
  "la serena": [-29.9027, -71.2519], "coquimbo": [-29.9533, -71.3436], "ovalle": [-30.6017, -71.2], "illapel": [-31.6308, -71.1653],
  "valparaiso": [-33.0472, -71.6127], "vina del mar": [-33.0245, -71.5518], "vina": [-33.0245, -71.5518],
  "renaca": [-32.9728, -71.5508], "concon": [-32.9228, -71.5253], "quilpue": [-33.0472, -71.4419],
  "villa alemana": [-33.0423, -71.3735], "san antonio": [-33.5928, -71.6075], "quillota": [-32.8797, -71.2489], "los andes": [-32.8337, -70.5983],
  "santiago": [-33.4489, -70.6693], "maipu": [-33.5167, -70.7667], "puente alto": [-33.6112, -70.5756], "la florida": [-33.5224, -70.599],
  "las condes": [-33.4099, -70.5688], "providencia": [-33.4314, -70.6093], "nunoa": [-33.4569, -70.5996], "san bernardo": [-33.5919, -70.6996],
  "quilicura": [-33.3672, -70.729], "pudahuel": [-33.4419, -70.7494], "estacion central": [-33.4606, -70.6944], "recoleta": [-33.4106, -70.6406],
  "conchali": [-33.3819, -70.675], "colina": [-33.2017, -70.675], "la cisterna": [-33.5375, -70.6628], "vitacura": [-33.3897, -70.5736],
  "rancagua": [-34.1708, -70.7444], "san fernando": [-34.5856, -70.9892], "rengo": [-34.4061, -70.8597], "machali": [-34.1814, -70.6494],
  "talca": [-35.4264, -71.6554], "curico": [-34.9828, -71.2392], "linares": [-35.8467, -71.5933], "cauquenes": [-35.9678, -72.3158],
  "chillan": [-36.6066, -72.1034], "san carlos": [-36.4244, -71.9583], "bulnes": [-36.7423, -72.2989],
  "concepcion": [-36.827, -73.0503], "talcahuano": [-36.7249, -73.1169], "los angeles": [-37.4697, -72.3537], "coronel": [-37.0289, -73.1339],
  "chiguayante": [-36.9239, -73.0289], "san pedro de la paz": [-36.8428, -73.1039],
  "temuco": [-38.7359, -72.5904], "padre las casas": [-38.7561, -72.5994], "angol": [-37.7969, -72.7164], "villarrica": [-39.2858, -72.2279], "pucon": [-39.2828, -71.9536],
  "valdivia": [-39.8142, -73.2459], "la union": [-40.2925, -73.0817], "rio bueno": [-40.3358, -72.9572],
  "puerto montt": [-41.4717, -72.9369], "osorno": [-40.5739, -73.1336], "castro": [-42.4828, -73.7644], "ancud": [-41.8697, -73.8203], "puerto varas": [-41.3195, -72.9854],
  "coyhaique": [-45.5712, -72.0685], "puerto aysen": [-45.4028, -72.6919],
  "punta arenas": [-53.1638, -70.9171], "puerto natales": [-51.7236, -72.4875],
};
const normComuna = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const coordOf = (c) => COMUNA_COORDS[normComuna(c.comuna)] || null;
function haversine(a, b) {
  const R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
function orderByProximity(clientes, startCoord) {
  const withC = clientes.filter((c) => coordOf(c));
  const without = clientes.filter((c) => !coordOf(c));
  if (withC.length <= 1) return clientes;
  const rest = [...withC]; const ordered = [];
  let cur = startCoord || coordOf(rest[0]);
  while (rest.length) {
    let bi = 0, bd = Infinity;
    rest.forEach((c, i) => { const d = haversine(cur, coordOf(c)); if (d < bd) { bd = d; bi = i; } });
    const next = rest.splice(bi, 1)[0];
    ordered.push(next); cur = coordOf(next);
  }
  return [...ordered, ...without];
}
function mapsSearchCity(q, ciudad) {
  return "https://www.google.com/maps/search/" + encodeURIComponent(q + " " + ciudad);
}
function waText(text, phone) {
  const base = phone ? "https://wa.me/" + phone.replace(/\D/g, "") : "https://wa.me/";
  return base + "?text=" + encodeURIComponent(text);
}
function gcalUrl(title, startISO, endISO, details, location) {
  const f = (s) => s.replace(/[-:]/g, "").replace(/\.\d+/, "");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(title) +
    "&dates=" + f(startISO) + "/" + f(endISO) +
    "&details=" + encodeURIComponent(details || "") +
    "&location=" + encodeURIComponent(location || "");
}
function outlookUrl(title, startISO, endISO, body, location) {
  return "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent" +
    "&subject=" + encodeURIComponent(title) +
    "&startdt=" + encodeURIComponent(startISO) +
    "&enddt=" + encodeURIComponent(endISO) +
    "&body=" + encodeURIComponent(body || "") +
    "&location=" + encodeURIComponent(location || "");
}
function downloadICS(title, startISO, endISO, desc, loc) {
  const f = (s) => new Date(s).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CRM Moto//ES",
    "BEGIN:VEVENT", "UID:" + uid() + "@crmmoto",
    "DTSTAMP:" + f(new Date().toISOString()),
    "DTSTART:" + f(startISO), "DTEND:" + f(endISO),
    "SUMMARY:" + title, "DESCRIPTION:" + (desc || ""), "LOCATION:" + (loc || ""),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "reunion.ics";
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 150);
}
function downloadICSMulti(events, filename = "visitas.ics") {
  const f = (s) => new Date(s).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CRM ICLA//ES"];
  events.forEach((e) => {
    ics.push("BEGIN:VEVENT", "UID:" + uid() + "@crmicla", "DTSTAMP:" + f(new Date().toISOString()),
      "DTSTART:" + f(e.start), "DTEND:" + f(e.end), "SUMMARY:" + (e.title || "Visita"),
      "DESCRIPTION:" + (e.desc || ""), "LOCATION:" + (e.loc || ""), "END:VEVENT");
  });
  ics.push("END:VCALENDAR");
  const blob = new Blob([ics.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 150);
}
async function resizeImage(file, max = 800) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------- UI primitivos ---------- */
function Btn({ children, onClick, kind = "ghost", as, href, small, type, ...rest }) {
  const cls = "btn btn-" + kind + (small ? " btn-sm" : "");
  if (as === "a") return <a className={cls} href={href} target="_blank" rel="noreferrer" {...rest}>{children}</a>;
  return <button className={cls} onClick={onClick} {...rest}>{children}</button>;
}
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className={"modal" + (wide ? " modal-wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
function Badge({ children, tone }) {
  return <span className={"badge badge-" + (tone || "n")}>{children}</span>;
}
function MultiChips({ options, value, onChange }) {
  const toggle = (o) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o} type="button"
          className={"chip" + (value.includes(o) ? " on" : "")}
          onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}
function Empty({ icon, title, sub }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <p className="empty-t">{title}</p>
      {sub && <p className="empty-s">{sub}</p>}
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
const EXTRA_CLIENTES = [{"id":"ext_001","vendedorId":"u_claudio","nombre":"La Baliza Suc.","rut":"77.890.216-K","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Pte. Alto","ciudad":"","dirComercial":"Gabriela Poniente 713, Pte. Alto","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Alfonso","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_002","vendedorId":"u_claudio","nombre":"Assem Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"San Joaquin","ciudad":"","dirComercial":"Salvador Allende 214, San Joaquin","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Martin","cobranzas":"","recepcion":""},"telefono":"56 9 20858915","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_003","vendedorId":"u_claudio","nombre":"El Chema","rut":"77.880.447-8","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Los Militares5620 of. 905, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"David Olguin","cobranzas":"","recepcion":""},"telefono":"56 9 85969649","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_004","vendedorId":"u_claudio","nombre":"Lubricentro G&M","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Padre Hurtado","ciudad":"","dirComercial":"Brasilia 2414 Local B, Padre Hurtado","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Eduardo Gomez","cobranzas":"","recepcion":""},"telefono":"56 9 54885533","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_005","vendedorId":"u_claudio","nombre":"Red bickers","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Viña","ciudad":"","dirComercial":"13 NORTE 1186, Viña, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Claudia","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_006","vendedorId":"u_claudio","nombre":"All Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Valparaiso","ciudad":"","dirComercial":"Avda Argentina 827, Valparaiso, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Geselle","cobranzas":"","recepcion":""},"telefono":"993138646","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_007","vendedorId":"u_claudio","nombre":"Zona Bikers","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Viña","ciudad":"","dirComercial":"San Antonio 1159, Viña, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Enrique","cobranzas":"","recepcion":""},"telefono":"996091192","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_008","vendedorId":"u_claudio","nombre":"Vivescooter","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Viña","ciudad":"","dirComercial":"San Martin 458 L.15, Viña, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Alberto","cobranzas":"","recepcion":""},"telefono":"963385330","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_009","vendedorId":"u_claudio","nombre":"Motosblott","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Viña","ciudad":"","dirComercial":"Avda Concon 1616, Viña, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Andreina","cobranzas":"","recepcion":""},"telefono":"973618954","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_010","vendedorId":"u_claudio","nombre":"VZ Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Reñaca","ciudad":"","dirComercial":"Avda. Borgoño 14191, Reñaca, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Abril","cobranzas":"","recepcion":""},"telefono":"971519361","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_011","vendedorId":"u_claudio","nombre":"Moto Val","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Valpo","ciudad":"","dirComercial":"Independencia 3062, Valpo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Carlos","cobranzas":"","recepcion":""},"telefono":"984963923","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_012","vendedorId":"u_claudio","nombre":"Mach Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Valparaíso","comuna":"Viña","ciudad":"","dirComercial":"4 oriente 1264, Viña, Valparaíso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"32 3148166","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_013","vendedorId":"u_claudio","nombre":"Motor bike store Spa.","rut":"77.673.593-0","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"La Ligua","ciudad":"","dirComercial":"Esmeralda 103, La Ligua","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_014","vendedorId":"u_claudio","nombre":"Natalia Varas Acuña","rut":"19.071.272-9","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Cabildo","ciudad":"","dirComercial":"Ferrocarril 700, Cabildo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Natalia","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_015","vendedorId":"u_claudio","nombre":"Grunefeld","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"La Calera","ciudad":"","dirComercial":"Josefina 226, La Calera","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Javier Grunefeld","cobranzas":"","recepcion":""},"telefono":"983182144","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_016","vendedorId":"u_claudio","nombre":"Comercial Grunefeld","rut":"77.308.687-9","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"San Felipe","ciudad":"","dirComercial":"Chacabuco 277, San Felipe","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Max Grunefeld","cobranzas":"","recepcion":""},"telefono":"983182144","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_017","vendedorId":"u_claudio","nombre":"Lorena  Pereira","rut":"15.066.279-6","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"San Felipe","ciudad":"","dirComercial":"Arturo Prat 1152, San Felipe","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Elena Pereira","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_018","vendedorId":"u_sebastian","nombre":"Azor Motor's","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_019","vendedorId":"u_sebastian","nombre":"NW Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_020","vendedorId":"u_sebastian","nombre":"Repuestos para Motos","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_021","vendedorId":"u_sebastian","nombre":"Taller Moto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56992215389","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_022","vendedorId":"u_sebastian","nombre":"Zeta Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_023","vendedorId":"u_sebastian","nombre":"Zona Rider","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Estación Central","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56937290201","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_024","vendedorId":"u_sebastian","nombre":"FMotors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56979965702","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_025","vendedorId":"u_sebastian","nombre":"Ghost Racing","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56975899791","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_026","vendedorId":"u_sebastian","nombre":"JMD Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56932658009","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_027","vendedorId":"u_sebastian","nombre":"Lubri Motos AG","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56959898434","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_028","vendedorId":"u_sebastian","nombre":"Moto Pasión JM","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56966327888","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_029","vendedorId":"u_sebastian","nombre":"Motos Colombia","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56952158485","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_030","vendedorId":"u_sebastian","nombre":"Oasis Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56953809490","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_031","vendedorId":"u_sebastian","nombre":"Patito Motos","rut":"76986442-3","estado":"Cliente","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56945089926","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_032","vendedorId":"u_sebastian","nombre":"Redmotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"2233154894","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_033","vendedorId":"u_sebastian","nombre":"Top Line","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56985057073","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_034","vendedorId":"u_sebastian","nombre":"Zona Motos Pro","rut":"Perdi el rut","estado":"Cliente","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56950764182","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_035","vendedorId":"u_sebastian","nombre":"JYC Motors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Lo Prado","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56994345489","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_036","vendedorId":"u_sebastian","nombre":"Cano Motor Bikes","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56986966837","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_037","vendedorId":"u_sebastian","nombre":"Infinity Motors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56982253279","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_038","vendedorId":"u_sebastian","nombre":"La Casa del Auto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56940957440","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_039","vendedorId":"u_sebastian","nombre":"Lubricentro Don Luis","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56946198820","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_040","vendedorId":"u_sebastian","nombre":"Pedro DyD Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_041","vendedorId":"u_sebastian","nombre":"Stop Bike","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56957256433","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_042","vendedorId":"u_sebastian","nombre":"Taller de Motos Román","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56956939900","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_043","vendedorId":"u_sebastian","nombre":"Taller Motocicletas Borgoño","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_044","vendedorId":"u_sebastian","nombre":"Wolff Biker","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Maipú","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56986922691","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_045","vendedorId":"u_sebastian","nombre":"Motos Leo","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Pudahuel","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56974012012","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_046","vendedorId":"u_sebastian","nombre":"Taller Arias Performance","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Pudahuel","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_047","vendedorId":"u_sebastian","nombre":"Taller Montero","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Pudahuel","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56959906039","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_048","vendedorId":"u_sebastian","nombre":"Markos Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Cerro Navia","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56991994058","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_049","vendedorId":"u_sebastian","nombre":"Arenita Motos","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Quilicura","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56967595765","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_050","vendedorId":"u_sebastian","nombre":"Whorkshop Motorcycle","rut":"perdi contacto","estado":"Cliente","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Quilicura","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"perdi numero","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_051","vendedorId":"u_sebastian","nombre":"C&M Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Quinta Normal","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56995050550","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_052","vendedorId":"u_sebastian","nombre":"JM Caracas","rut":"","estado":"Lead","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Quinta Normal","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56984738329","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_053","vendedorId":"u_sebastian","nombre":"Star Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Quinta Normal","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56944252629","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_054","vendedorId":"u_sebastian","nombre":"Taller Rally Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Quinta Normal","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"Perdi el numero","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_055","vendedorId":"u_sebastian","nombre":"Rram Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Recoleta","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56993221804","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_056","vendedorId":"u_sebastian","nombre":"R85 Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Metropolitana","comuna":"Puente Alto","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56995011591","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_057","vendedorId":"u_sebastian","nombre":"Fenixmotos","rut":"77263771-3","estado":"Cliente","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"La Pintana","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56936211549","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_058","vendedorId":"u_sebastian","nombre":"En Ruta Store","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Pedro Aguirre Cerda","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56975108934","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_059","vendedorId":"u_sebastian","nombre":"Full Cars","rut":"Perdi el rut","estado":"Cliente","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Huechuraba","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56944757888","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_060","vendedorId":"u_sebastian","nombre":"biker +58","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"","comuna":"Peñaflor","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56952293806","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_061","vendedorId":"u_claudio","nombre":"Moto Performance","rut":"77.222.438-9","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Biobío","comuna":"Concepción","ciudad":"","dirComercial":"Maipu 941, Concepción, Biobío","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Victor Araneda","cobranzas":"","recepcion":""},"telefono":"56 9 32562348","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_062","vendedorId":"u_claudio","nombre":"Yandel Spa","rut":"77.574.103-3","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Biobío","comuna":"Concepción","ciudad":"","dirComercial":"Orompello 770, Concepción, Biobío","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"Yoiner Aular","cobranzas":"","recepcion":""},"telefono":"56 9 40348133","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]},{"id":"ext_063","vendedorId":"u_claudio","nombre":"Crazy Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":[],"region":"Biobío","comuna":"Concepción","ciudad":"","dirComercial":"","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"56 9 50711691","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[]}];
const EXTRA_VER = 1;
const ENRICH = {"ext_041": {"telefono": "+56 9 5725 6433", "dirComercial": "Libertad 878, Maipu, Metropolitana", "comuna": "Maipu", "region": "Metropolitana", "segmentos": ["Taller"], "notas": "Prospecto (Google Maps). Rating 4.8★, 50 reseñas."}, "ext_036": {"telefono": "+56 9 8696 6837", "dirComercial": "Venado 1060, Maipu, Metropolitana", "comuna": "Maipu", "region": "Metropolitana", "segmentos": ["Taller"], "notas": "Prospecto (Google Maps). Rating 5★, 9 reseñas."}, "ext_032": {"telefono": "+56 2 3315 4894", "dirComercial": "Av. Vicuna Mackenna 8264, La Florida, Metropolitana", "comuna": "La Florida", "region": "Metropolitana", "segmentos": ["Concesionario"], "notas": "Prospecto (Google Maps). Rating 4.5★, 272 reseñas."}, "ext_031": {"telefono": "+56 2 2261 6898", "dirComercial": "Av. Vicuna Mackenna 10197, La Florida, Metropolitana", "comuna": "La Florida", "region": "Metropolitana", "segmentos": ["Taller", "Tienda"], "notas": "Prospecto (Google Maps). Rating 4.7★, 422 reseñas."}, "ext_030": {"telefono": "+56 9 5380 9490", "dirComercial": "Pto Eden 10317, La Florida, Metropolitana", "comuna": "La Florida", "region": "Metropolitana", "segmentos": ["Tienda"], "notas": "Prospecto (Google Maps). Rating 5★, 463 reseñas."}, "ext_007": {"telefono": "+56 9 9609 1192", "dirComercial": "San Antonio 1159, Vina del Mar, Valparaiso", "comuna": "Vina del Mar", "region": "Valparaiso", "segmentos": ["Tienda", "Taller"], "notas": "Prospecto (Google Maps). Rating 4.4★, 105 reseñas."}, "ext_012": {"telefono": "+56 32 314 8166", "dirComercial": "4 Ote. 1264, Vina del Mar, Valparaiso", "comuna": "Vina del Mar", "region": "Valparaiso", "segmentos": ["Tienda", "Concesionario"], "notas": "Prospecto (Google Maps). Rating 4.2★, 271 reseñas."}, "seed_281": {"telefono": "+56 9 8947 8668", "dirComercial": "Av. B. O'Higgins 116, Local 1, San Fernando, O'Higgins", "comuna": "San Fernando", "region": "O'Higgins", "segmentos": ["Tienda"], "notas": "Prospecto (Google Maps)."}, "seed_422": {"telefono": "+56 64 224 2441", "dirComercial": "Los Carrera 1291, Osorno, Los Lagos", "comuna": "Osorno", "region": "Los Lagos", "segmentos": ["Tienda"], "notas": "Prospecto (Google Maps). Rating 4.3★, 129 reseñas."}, "seed_184": {"telefono": "+56 9 6248 2885", "dirComercial": "Capitan Ignacio Carrera Pinto 1128, Punta Arenas, Magallanes", "comuna": "Punta Arenas", "region": "Magallanes", "segmentos": ["Tienda", "Taller"], "notas": "Prospecto (Google Maps). Rating 4.8★, 143 reseñas."}, "ext_011": {"telefono": "+56 9 8496 3923", "dirComercial": "Independencia 3062, Valparaiso, Valparaiso", "comuna": "Valparaiso", "region": "Valparaiso", "segmentos": ["Tienda"], "notas": "Prospecto (Google Maps). Rating 4.4★, 50 reseñas."}, "ext_056": {"telefono": "+56 9 9501 1591", "dirComercial": "Nonato Coo 3236, Puente Alto, Metropolitana", "comuna": "Puente Alto", "region": "Metropolitana", "segmentos": ["Tienda", "Taller"], "notas": "Prospecto (Google Maps). Rating 4.1★, 44 reseñas."}};
const ENRICH_VER = 1;
const PROSPECTS = [{"id":"prosp_001","vendedorId":"","nombre":"U-Bike Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 650, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2665 1344","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 432 reseñas."},{"id":"prosp_002","vendedorId":"","nombre":"MotoStar Lira","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 610, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2634 9895","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 397 reseñas."},{"id":"prosp_003","vendedorId":"","nombre":"MotoMundi Lira","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 689, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2666 0690","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 540 reseñas."},{"id":"prosp_004","vendedorId":"","nombre":"Imoto - Sucursal Lira","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 669, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2222 7001","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 522 reseñas."},{"id":"prosp_005","vendedorId":"","nombre":"CVMOTOS","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 640, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2665 6281","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 476 reseñas."},{"id":"prosp_006","vendedorId":"","nombre":"PALMAX (KTM)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 533, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2222 9526","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 824 reseñas."},{"id":"prosp_007","vendedorId":"","nombre":"Motorrad Chile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Manuel Antonio Tocornal 566, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3929 5704","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.6★, 429 reseñas."},{"id":"prosp_008","vendedorId":"","nombre":"Importadora Motoxtreme","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Roberto Espinoza 941, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8164 4913","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 89 reseñas."},{"id":"prosp_009","vendedorId":"","nombre":"Bikesport (Lira)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 868, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2222 8889","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 88 reseñas."},{"id":"prosp_010","vendedorId":"","nombre":"Motomundi / Matias Cousino","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 588, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2666 0690","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 228 reseñas."},{"id":"prosp_011","vendedorId":"","nombre":"RinoMotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 8482, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2891 2127","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 334 reseñas."},{"id":"prosp_012","vendedorId":"","nombre":"Yamaimport Ltda","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 8326, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2299 1000","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 221 reseñas."},{"id":"prosp_013","vendedorId":"","nombre":"Motoaventura Santiago","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 7780, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7516 1033","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 114 reseñas."},{"id":"prosp_014","vendedorId":"","nombre":"Luxus Automotora Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Cerro El Plomo 5931, of. 413, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5744 8826","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 64 reseñas."},{"id":"prosp_015","vendedorId":"","nombre":"Tienda Mototrainer","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 13163, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7971 5597","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 145 reseñas."},{"id":"prosp_016","vendedorId":"","nombre":"Colvin & Colvin","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario","Taller"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 9399, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2224 3434","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 291 reseñas."},{"id":"prosp_017","vendedorId":"","nombre":"Yamaha Motos (Las Condes)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 8326, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2299 1000","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 869 reseñas."},{"id":"prosp_018","vendedorId":"","nombre":"Triumph Motorcycles Chile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Las Condes 7725, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2880 0762","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 521 reseñas."},{"id":"prosp_019","vendedorId":"","nombre":"Mimoto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Pdte. Sebastian Pinera 785, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2204 9215","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 146 reseñas."},{"id":"prosp_020","vendedorId":"","nombre":"Procircuit Manquehue","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"Las Condes","ciudad":"","dirComercial":"Av. Manquehue Sur 576, Las Condes, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 600 085 0405","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 160 reseñas."},{"id":"prosp_021","vendedorId":"","nombre":"Maximotos - Taller Mecanico","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Metropolitana","comuna":"Maipu","ciudad":"","dirComercial":"Nueva San Martin 1096, Maipu, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7264 6387","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 126 reseñas."},{"id":"prosp_022","vendedorId":"","nombre":"MotomeK","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Metropolitana","comuna":"Maipu","ciudad":"","dirComercial":"Opus Seis 440, Maipu, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8923 3196","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 31 reseñas."},{"id":"prosp_023","vendedorId":"","nombre":"Hp plus","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Maipu","ciudad":"","dirComercial":"Primera Transversal 3365, Maipu, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3231 2451","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 207 reseñas."},{"id":"prosp_024","vendedorId":"","nombre":"OXS Accesorios Motociclista","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Nunoa","ciudad":"","dirComercial":"Av. Irarrazaval 1154, Nunoa, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6471 8824","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 983 reseñas."},{"id":"prosp_025","vendedorId":"","nombre":"TodoMoto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 683, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3912 6349","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 76 reseñas."},{"id":"prosp_026","vendedorId":"","nombre":"Royal Moto Service","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 823, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 3317 2212","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 181 reseñas."},{"id":"prosp_027","vendedorId":"","nombre":"Colmotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Nunoa","ciudad":"","dirComercial":"Av. Vicuna Mackenna 1260, Nunoa, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2268 6319","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 225 reseñas."},{"id":"prosp_028","vendedorId":"","nombre":"Motoss","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"La Reina","ciudad":"","dirComercial":"Alcalde Francisco Dominguez 2240, La Reina, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8262 7944","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 172 reseñas."},{"id":"prosp_029","vendedorId":"","nombre":"CIDEF Kawasaki Repuestos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Providencia","ciudad":"","dirComercial":"Av. Francisco Bilbao 2126, Providencia, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2730 7713","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.5★, 136 reseñas."},{"id":"prosp_030","vendedorId":"","nombre":"Importadora Vini","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Santiago","ciudad":"","dirComercial":"Lira 814, Santiago, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2665 1917","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 780 reseñas."},{"id":"prosp_031","vendedorId":"","nombre":"Megamotos Yamaha","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"Av. Vicuna Mackenna 7387, La Florida, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 2635 2322","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 63 reseñas."},{"id":"prosp_032","vendedorId":"","nombre":"Motos DC - Repuestos e Insumos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"Av. Trinidad Ote. 173, La Florida, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7730 9894","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_033","vendedorId":"","nombre":"Supermotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"Sta. Julia 527, La Florida, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 2744 2617","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 29 reseñas."},{"id":"prosp_034","vendedorId":"","nombre":"Megamotos Honda","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"Av. Vicuna Mackenna 7387, La Florida, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3916 6628","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 397 reseñas."},{"id":"prosp_035","vendedorId":"","nombre":"Central Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"La Florida","ciudad":"","dirComercial":"Walker Martinez 1445, La Florida, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2894 3543","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 47 reseñas."},{"id":"prosp_036","vendedorId":"","nombre":"Red Bikers","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Vina del Mar","ciudad":"","dirComercial":"13 Nte. 1186, Vina del Mar, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 32 321 5024","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 304 reseñas."},{"id":"prosp_037","vendedorId":"","nombre":"Bikesport (Quillota 384)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Valparaiso","comuna":"Vina del Mar","ciudad":"","dirComercial":"Quillota 384, Local 1, Vina del Mar, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 32 361 6440","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.9★, 66 reseñas."},{"id":"prosp_038","vendedorId":"","nombre":"Bikesport Vina","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Valparaiso","comuna":"Vina del Mar","ciudad":"","dirComercial":"San Antonio 961, Vina del Mar, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 51 249 5023","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 113 reseñas."},{"id":"prosp_039","vendedorId":"","nombre":"Motomundi Vina","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Valparaiso","comuna":"Vina del Mar","ciudad":"","dirComercial":"Quillota 384, Vina del Mar, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2666 0690","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 264 reseñas."},{"id":"prosp_040","vendedorId":"","nombre":"G&P Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Biobio","comuna":"Concepcion","ciudad":"","dirComercial":"Paicavi 1980, Concepcion, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5782 4422","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 315 reseñas."},{"id":"prosp_041","vendedorId":"","nombre":"Motos Conce","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Biobio","comuna":"Hualpen","ciudad":"","dirComercial":"Av. Cristobal Colon 7737, Hualpen, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 72 reseñas."},{"id":"prosp_042","vendedorId":"","nombre":"Motoemotion Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Biobio","comuna":"Concepcion","ciudad":"","dirComercial":"Maipu 901, Concepcion, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 41 333 7465","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 101 reseñas."},{"id":"prosp_043","vendedorId":"","nombre":"DipMoto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Biobio","comuna":"Concepcion","ciudad":"","dirComercial":"Ongolmo 674, Concepcion, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 41 225 7245","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.8★, 120 reseñas."},{"id":"prosp_044","vendedorId":"","nombre":"CFMOTO Concepcion","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Biobio","comuna":"Talcahuano","ciudad":"","dirComercial":"Av. Pdte. Jorge Alessandri 3763, Talcahuano, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3235 1593","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.5★, 77 reseñas."},{"id":"prosp_045","vendedorId":"","nombre":"B-Motto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Biobio","comuna":"Concepcion","ciudad":"","dirComercial":"Ventus 1261, Concepcion, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 41 324 4259","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 95 reseñas."},{"id":"prosp_046","vendedorId":"","nombre":"Moto Sport","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario","Taller"],"region":"Antofagasta","comuna":"Antofagasta","ciudad":"","dirComercial":"Av. Grecia 1870, Antofagasta, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4412 8545","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 147 reseñas."},{"id":"prosp_047","vendedorId":"","nombre":"Motos Cordero (Honda)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Antofagasta","comuna":"Antofagasta","ciudad":"","dirComercial":"Av. Argentina 1256, Antofagasta, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 55 237 5795","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 132 reseñas."},{"id":"prosp_048","vendedorId":"","nombre":"Henyumak Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Antofagasta","comuna":"Antofagasta","ciudad":"","dirComercial":"Sgto. Enrique Coke 527, Antofagasta, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 55 286 2162","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 118 reseñas."},{"id":"prosp_049","vendedorId":"","nombre":"Crispa (Accesorios y Reparacion)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Antofagasta","comuna":"Antofagasta","ciudad":"","dirComercial":"Lima 466, Antofagasta, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4247 4325","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.6★, 29 reseñas."},{"id":"prosp_050","vendedorId":"","nombre":"Kingmotoschile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Antofagasta","comuna":"Antofagasta","ciudad":"","dirComercial":"Av. Antonio Rendic 4627, Antofagasta, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9614 3637","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.4★, 5 reseñas."},{"id":"prosp_051","vendedorId":"","nombre":"Tonino Motos (Balmaceda 3394)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Coquimbo","comuna":"La Serena","ciudad":"","dirComercial":"Av. Balmaceda 3394, La Serena, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 51 264 2529","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 265 reseñas."},{"id":"prosp_052","vendedorId":"","nombre":"CTSMOTO La Serena (KTM)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Coquimbo","comuna":"La Serena","ciudad":"","dirComercial":"Av. Balmaceda 4500-B, La Serena, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6700 6921","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 165 reseñas."},{"id":"prosp_053","vendedorId":"","nombre":"Tonino Motos (Balmaceda 1461)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Coquimbo","comuna":"La Serena","ciudad":"","dirComercial":"Av. Balmaceda 1461, La Serena, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 51 264 2529","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.9★, 185 reseñas."},{"id":"prosp_054","vendedorId":"","nombre":"Motomundi La Serena","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Coquimbo","comuna":"La Serena","ciudad":"","dirComercial":"Av. Balmaceda 3039, La Serena, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7213 0267","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 115 reseñas."},{"id":"prosp_055","vendedorId":"","nombre":"Blumen Motos (Ulriksen)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Coquimbo","comuna":"La Serena","ciudad":"","dirComercial":"Av. Guillermo Ulriksen 340, La Serena, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 51 248 8595","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 191 reseñas."},{"id":"prosp_056","vendedorId":"","nombre":"Motopro","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Araucania","comuna":"Temuco","ciudad":"","dirComercial":"Manuel Rodriguez 605, Temuco, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 45 231 3148","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 144 reseñas."},{"id":"prosp_057","vendedorId":"","nombre":"Terremoto Yamaha","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Araucania","comuna":"Temuco","ciudad":"","dirComercial":"Claro Solar 358, Temuco, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 45 231 2800","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 210 reseñas."},{"id":"prosp_058","vendedorId":"","nombre":"Terremoto Planet","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Araucania","comuna":"Temuco","ciudad":"","dirComercial":"Claro Solar 401, Temuco, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4047 0266","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.8★, 45 reseñas."},{"id":"prosp_059","vendedorId":"","nombre":"Motomaster","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Araucania","comuna":"Temuco","ciudad":"","dirComercial":"Caupolican 489, Temuco, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6228 0618","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.9★, 141 reseñas."},{"id":"prosp_060","vendedorId":"","nombre":"Motolike (CF Motos / Motorrad)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Araucania","comuna":"Temuco","ciudad":"","dirComercial":"Caupolican 636, Temuco, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9910 0732","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.4★, 37 reseñas."},{"id":"prosp_061","vendedorId":"","nombre":"Austral Motosport","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Puerto Montt","ciudad":"","dirComercial":"Urmeneta 996, Puerto Montt, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8507 3655","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 134 reseñas."},{"id":"prosp_062","vendedorId":"","nombre":"Multimoto Puerto Montt (M. Rodriguez)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Puerto Montt","ciudad":"","dirComercial":"Manuel Rodriguez 216, Puerto Montt, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5622 4015","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_063","vendedorId":"","nombre":"Multimoto Puerto Montt (Crucero)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Los Lagos","comuna":"Puerto Montt","ciudad":"","dirComercial":"Crucero 1890, Puerto Montt, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 2243 7770","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 39 reseñas."},{"id":"prosp_064","vendedorId":"","nombre":"Motos JV","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Puerto Montt","ciudad":"","dirComercial":"Rengifo 970, Puerto Montt, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7539 5436","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 149 reseñas."},{"id":"prosp_065","vendedorId":"","nombre":"Merida Motors (Repuestos)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Puerto Montt","ciudad":"","dirComercial":"Providencia 1425, Puerto Montt, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_066","vendedorId":"","nombre":"IKO - Venta de Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Tarapaca","comuna":"Iquique","ciudad":"","dirComercial":"Oficina Iris 39, Iquique, Tarapaca","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 57 226 9295","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 5 reseñas."},{"id":"prosp_067","vendedorId":"","nombre":"A&M Riders Motorcycle Shop","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Tarapaca","comuna":"Iquique","ciudad":"","dirComercial":"Av. Arturo Prat Chacon 3032, Iquique, Tarapaca","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9650 7875","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 7 reseñas."},{"id":"prosp_068","vendedorId":"","nombre":"Biker Motorcycle","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Tarapaca","comuna":"Iquique","ciudad":"","dirComercial":"Av. Salvador Allende 2407, Iquique, Tarapaca","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4799 4518","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 51 reseñas."},{"id":"prosp_069","vendedorId":"","nombre":"Yamaha Motoca Rancagua","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"O'Higgins","comuna":"Rancagua","ciudad":"","dirComercial":"Av. Capitan Ramon Freire 645, Rancagua, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 72 253 9117","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 209 reseñas."},{"id":"prosp_070","vendedorId":"","nombre":"Repuestosya Motorcycles","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"Rancagua","ciudad":"","dirComercial":"Av. Espana 1, Local 3, Rancagua, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7580 9560","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 188 reseñas."},{"id":"prosp_071","vendedorId":"","nombre":"Motos Godoy","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"Rancagua","ciudad":"","dirComercial":"Bueras 0202, Rancagua, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9214 8185","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 61 reseñas."},{"id":"prosp_072","vendedorId":"","nombre":"Fullmotos Rancagua","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"Rancagua","ciudad":"","dirComercial":"Av. Lib. B. O'Higgins 651, Rancagua, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 72 224 2308","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 52 reseñas."},{"id":"prosp_073","vendedorId":"","nombre":"Motofix Talca","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Maule","comuna":"Talca","ciudad":"","dirComercial":"Calle 6 Sur 592 (18 Oriente), Talca, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 71 228 9961","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 81 reseñas."},{"id":"prosp_074","vendedorId":"","nombre":"Santa Maria Honda Talca","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Maule","comuna":"Talca","ciudad":"","dirComercial":"Cuatro Nte. 1649, Talca, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 71 221 7038","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 140 reseñas."},{"id":"prosp_075","vendedorId":"","nombre":"MotoGrip Yamaha Talca","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Maule","comuna":"Talca","ciudad":"","dirComercial":"Cuatro Nte. 1641, Talca, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 71 274 6018","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.6★, 56 reseñas."},{"id":"prosp_076","vendedorId":"","nombre":"MotoRock","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Maule","comuna":"Talca","ciudad":"","dirComercial":"Av. 2 Sur 771, Talca, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7696 7438","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 294 reseñas."},{"id":"prosp_077","vendedorId":"","nombre":"Mundo Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Maule","comuna":"Talca","ciudad":"","dirComercial":"Quince Ote. 1013, Talca, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3★, 6 reseñas."},{"id":"prosp_078","vendedorId":"","nombre":"Chaleco Lopez Motorsport","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. Arturo Alessandri 1133, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2419 8882","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 134 reseñas."},{"id":"prosp_079","vendedorId":"","nombre":"Mxtreme Curico","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. Freire 420 A, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4130 3684","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 5 reseñas."},{"id":"prosp_080","vendedorId":"","nombre":"Pro-store Chile Motocicletas","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. Camilo Henriquez 96, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4627 4098","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 16 reseñas."},{"id":"prosp_081","vendedorId":"","nombre":"Motoservice Curico","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. Camilo Henriquez 172, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9479 5850","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 56 reseñas."},{"id":"prosp_082","vendedorId":"","nombre":"Moto Club Curico","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. O'Higgins 305, Local 1, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5476 8606","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.3★, 6 reseñas."},{"id":"prosp_083","vendedorId":"","nombre":"Todomotos Alcaino","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Maule","comuna":"Curico","ciudad":"","dirComercial":"Av. Amsterdam 1098, Curico, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7777 1299","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.8★, 4 reseñas."},{"id":"prosp_084","vendedorId":"","nombre":"Mimoto Linares","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Maule","comuna":"Linares","ciudad":"","dirComercial":"Valentin Letelier 845, Linares, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 73 233 0988","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 65 reseñas."},{"id":"prosp_085","vendedorId":"","nombre":"ProRide - GasGas Chile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Maule","comuna":"Linares","ciudad":"","dirComercial":"J. Espinoza 1067, Linares, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3236 4435","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 1 reseñas."},{"id":"prosp_086","vendedorId":"","nombre":"Motonux Linares","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Maule","comuna":"Linares","ciudad":"","dirComercial":"Av. Circunvalacion Nte. km 1.5, Linares, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8424 6320","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_087","vendedorId":"","nombre":"Venom Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Maule","comuna":"Linares","ciudad":"","dirComercial":"Av. Brasil 392, Linares, Maule","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8129 0379","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_088","vendedorId":"","nombre":"NovaMotos Chillan","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Av. Libertad 90, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8866 0911","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.3★, 36 reseñas."},{"id":"prosp_089","vendedorId":"","nombre":"Motos Chillan (multimarca)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Av. Argentina 562, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3335 3978","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 121 reseñas."},{"id":"prosp_090","vendedorId":"","nombre":"Carmal Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Yerbas Buenas 915, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5332 2805","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 29 reseñas."},{"id":"prosp_091","vendedorId":"","nombre":"Motos Santa Carmela","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Av. Libertad 19, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5651 8592","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.1★, 43 reseñas."},{"id":"prosp_092","vendedorId":"","nombre":"JM Motostore","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Av. Libertad 138, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 42 223 1090","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 46 reseñas."},{"id":"prosp_093","vendedorId":"","nombre":"Mas Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Arturo Prat 928, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7256 3199","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 66 reseñas."},{"id":"prosp_094","vendedorId":"","nombre":"Green Biker","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Constitucion 1008, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7831 7535","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 2 reseñas."},{"id":"prosp_095","vendedorId":"","nombre":"Mamut Motos Chillan","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Nuble","comuna":"Chillan","ciudad":"","dirComercial":"Variante Collin 215, Chillan, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 2 reseñas."},{"id":"prosp_096","vendedorId":"","nombre":"The Motoz","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"San Carlos","ciudad":"","dirComercial":"Tte. Tomas Yavar 229, San Carlos, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6768 6558","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 19 reseñas."},{"id":"prosp_097","vendedorId":"","nombre":"VenexMoto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"San Carlos","ciudad":"","dirComercial":"Vicuna 853, San Carlos, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 2058 8865","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_098","vendedorId":"","nombre":"P&M Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"San Carlos","ciudad":"","dirComercial":"Sinforiano Ossa 901, San Carlos, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4214 3642","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_099","vendedorId":"","nombre":"Contreras Motors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Nuble","comuna":"San Carlos","ciudad":"","dirComercial":"Vicuna Mackenna 702, San Carlos, Nuble","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3226 9099","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_100","vendedorId":"","nombre":"Motosport San Fernando","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"O'Higgins","comuna":"San Fernando","ciudad":"","dirComercial":"Tres Montes 780, San Fernando, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 72 296 5771","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 83 reseñas."},{"id":"prosp_101","vendedorId":"","nombre":"Moto Fenix Racing","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"San Fernando","ciudad":"","dirComercial":"Chillan 1020, San Fernando, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6436 0352","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 13 reseñas."},{"id":"prosp_102","vendedorId":"","nombre":"Level Up Moto Repuestos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"San Fernando","ciudad":"","dirComercial":"Chillan 402, Local 1, San Fernando, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6332 6910","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 1 reseñas."},{"id":"prosp_103","vendedorId":"","nombre":"NDF Xtreme","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"Santa Cruz","ciudad":"","dirComercial":"San Martin 126, Santa Cruz, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6787 7630","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 5 reseñas."},{"id":"prosp_104","vendedorId":"","nombre":"Valenzano Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"O'Higgins","comuna":"Santa Cruz","ciudad":"","dirComercial":"Almendroza 20, Santa Cruz, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9519 9593","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_105","vendedorId":"","nombre":"Repuestos de Oriente","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"O'Higgins","comuna":"Santa Cruz","ciudad":"","dirComercial":"Federico Errazuriz 500, Santa Cruz, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6670 5034","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 22 reseñas."},{"id":"prosp_106","vendedorId":"","nombre":"Tienda Rony Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"O'Higgins","comuna":"Rengo","ciudad":"","dirComercial":"Armando Martinez 235, Rengo, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7532 0943","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3★, 2 reseñas."},{"id":"prosp_107","vendedorId":"","nombre":"Tomi Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"O'Higgins","comuna":"Rengo","ciudad":"","dirComercial":"Ernesto Riquelme s/n, Rengo, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_108","vendedorId":"","nombre":"C F Choppers","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"O'Higgins","comuna":"Rengo","ciudad":"","dirComercial":"Juan Egenau 467, Rengo, O'Higgins","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 6 reseñas."},{"id":"prosp_109","vendedorId":"","nombre":"Repuestos de Motos Paola Diaz","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Arica y Parinacota","comuna":"Arica","ciudad":"","dirComercial":"Jose Santos Chocano 2476, Arica, Arica y Parinacota","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9611 9328","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 53 reseñas."},{"id":"prosp_110","vendedorId":"","nombre":"Fox Store Arica","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Arica y Parinacota","comuna":"Arica","ciudad":"","dirComercial":"San Marcos 428a, Arica, Arica y Parinacota","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8704 2485","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 2 reseñas."},{"id":"prosp_111","vendedorId":"","nombre":"Taller Motocicletas Todomoto Arica","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Arica y Parinacota","comuna":"Arica","ciudad":"","dirComercial":"Av. Renato Rocca 1323, Arica, Arica y Parinacota","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9450 7040","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_112","vendedorId":"","nombre":"E.Albasini Motoshop","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Atacama","comuna":"Copiapo","ciudad":"","dirComercial":"Ananucas 198, Copiapo, Atacama","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5008 3424","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 136 reseñas."},{"id":"prosp_113","vendedorId":"","nombre":"CSI Motorsports","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Atacama","comuna":"Copiapo","ciudad":"","dirComercial":"Av. Copayapu 1420, Copiapo, Atacama","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2725 5571","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 31 reseñas."},{"id":"prosp_114","vendedorId":"","nombre":"RPS Tuning (Accesorios Motos)","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Atacama","comuna":"Copiapo","ciudad":"","dirComercial":"Maipu 285, Copiapo, Atacama","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5315 4624","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 45 reseñas."},{"id":"prosp_115","vendedorId":"","nombre":"Motos Marre","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Atacama","comuna":"Copiapo","ciudad":"","dirComercial":"Carlos Van Buren 356, Copiapo, Atacama","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8471 1652","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 16 reseñas."},{"id":"prosp_116","vendedorId":"","nombre":"Servimotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Atacama","comuna":"Copiapo","ciudad":"","dirComercial":"Av. Copayapu 1536, Copiapo, Atacama","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5902 1006","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 25 reseñas."},{"id":"prosp_117","vendedorId":"","nombre":"ESR Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Los Rios","comuna":"Valdivia","ciudad":"","dirComercial":"Ruta 206 2371, Valdivia, Los Rios","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4251 6008","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 136 reseñas."},{"id":"prosp_118","vendedorId":"","nombre":"CPR Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Los Rios","comuna":"Valdivia","ciudad":"","dirComercial":"Av. Pedro Montt 1780, Valdivia, Los Rios","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 63 222 4716","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 99 reseñas."},{"id":"prosp_119","vendedorId":"","nombre":"MotoGarage","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Los Rios","comuna":"Valdivia","ciudad":"","dirComercial":"Cjon. Kunstman 3551, Valdivia, Los Rios","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9885 4718","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 91 reseñas."},{"id":"prosp_120","vendedorId":"","nombre":"JC Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Los Rios","comuna":"Valdivia","ciudad":"","dirComercial":"Pje. Tunez 264, Valdivia, Los Rios","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3723 9339","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_121","vendedorId":"","nombre":"Derco Motos Valdivia","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Los Rios","comuna":"Valdivia","ciudad":"","dirComercial":"Av. Ramon Picarte 1980, Local 7, Valdivia, Los Rios","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7331 5163","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_122","vendedorId":"","nombre":"MotoArt Ltda","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Los Lagos","comuna":"Osorno","ciudad":"","dirComercial":"Ecuador 891 esq. Av. Rodriguez, Osorno, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 64 221 8610","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 61 reseñas."},{"id":"prosp_123","vendedorId":"","nombre":"Austral MotoSport SPA","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Los Lagos","comuna":"Osorno","ciudad":"","dirComercial":"Buenos Aires 1972, Osorno, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7468 1970","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 19 reseñas."},{"id":"prosp_124","vendedorId":"","nombre":"Motoaventura Chile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Osorno","ciudad":"","dirComercial":"Argomedo 739, Osorno, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 64 224 9123","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 218 reseñas."},{"id":"prosp_125","vendedorId":"","nombre":"Road Moto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Los Lagos","comuna":"Osorno","ciudad":"","dirComercial":"Av. Manuel Rodriguez 1561, Osorno, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5526 8068","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 63 reseñas."},{"id":"prosp_126","vendedorId":"","nombre":"Megamotors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario","Taller"],"region":"Magallanes","comuna":"Punta Arenas","ciudad":"","dirComercial":"Av. Bulnes Km 3.5 Nte. (Zona Franca), Punta Arenas, Magallanes","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9206 1029","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 60 reseñas."},{"id":"prosp_127","vendedorId":"","nombre":"Bbo Motors","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Magallanes","comuna":"Punta Arenas","ciudad":"","dirComercial":"Chiloe 328, Punta Arenas, Magallanes","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5668 9557","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3★, 2 reseñas."},{"id":"prosp_128","vendedorId":"","nombre":"Motos Coyhaique","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Aysen","comuna":"Coyhaique","ciudad":"","dirComercial":"Los Coigues 824, Coyhaique, Aysen","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9816 5422","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 74 reseñas."},{"id":"prosp_129","vendedorId":"","nombre":"Clan X Motos Coyhaique","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Aysen","comuna":"Coyhaique","ciudad":"","dirComercial":"Almte. Simpson 795, Coyhaique, Aysen","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9308 6022","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 86 reseñas."},{"id":"prosp_130","vendedorId":"","nombre":"Motos GYV Coyhaique","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Aysen","comuna":"Coyhaique","ciudad":"","dirComercial":"Camino Reserva Forestal, Coyhaique, Aysen","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4778 7152","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 8 reseñas."},{"id":"prosp_131","vendedorId":"","nombre":"Motos Inostroza Store","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Biobio","comuna":"Los Angeles","ciudad":"","dirComercial":"Colon 738, Los Angeles, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 91 reseñas."},{"id":"prosp_132","vendedorId":"","nombre":"Ememotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Biobio","comuna":"Los Angeles","ciudad":"","dirComercial":"Villagran 364, Los Angeles, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3381 0063","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 63 reseñas."},{"id":"prosp_133","vendedorId":"","nombre":"Mx Marchioni Los Angeles","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Biobio","comuna":"Los Angeles","ciudad":"","dirComercial":"Colon 701, Los Angeles, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6375 0843","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 2.9★, 16 reseñas."},{"id":"prosp_134","vendedorId":"","nombre":"R-Motors EIRL","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Biobio","comuna":"Los Angeles","ciudad":"","dirComercial":"Almagro 801 / Janequeo 270, Los Angeles, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5482 9275","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 12 reseñas."},{"id":"prosp_135","vendedorId":"","nombre":"Maxi Enduro-Cross","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Biobio","comuna":"Los Angeles","ciudad":"","dirComercial":"Bulnes 220, Local 106, Los Angeles, Biobio","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4586 9233","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 1 reseñas."},{"id":"prosp_136","vendedorId":"","nombre":"Lopez Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Valparaiso","ciudad":"","dirComercial":"Juana Ross 192, Valparaiso, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5148 8430","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.8★, 79 reseñas."},{"id":"prosp_137","vendedorId":"","nombre":"Allmotos Ltda","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Valparaiso","ciudad":"","dirComercial":"Av. Argentina 827, Valparaiso, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3113 8646","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 23 reseñas."},{"id":"prosp_138","vendedorId":"","nombre":"Wild Biker","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Quilpue","ciudad":"","dirComercial":"Freire 634, Quilpue, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 186 reseñas."},{"id":"prosp_139","vendedorId":"","nombre":"Pro Motos Castillo","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Antofagasta","comuna":"Calama","ciudad":"","dirComercial":"Mexico 2636, Calama, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7497 2936","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 306 reseñas."},{"id":"prosp_140","vendedorId":"","nombre":"Calama Firma Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Antofagasta","comuna":"Calama","ciudad":"","dirComercial":"Eduardo Abaroa 2214, Calama, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2324 2643","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 32 reseñas."},{"id":"prosp_141","vendedorId":"","nombre":"Plexix Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Antofagasta","comuna":"Calama","ciudad":"","dirComercial":"Eduardo Abaroa 1635, Calama, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8222 2714","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 10 reseñas."},{"id":"prosp_142","vendedorId":"","nombre":"Motoventura Calama","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Antofagasta","comuna":"Calama","ciudad":"","dirComercial":"La Paz 1661, Calama, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4264 6332","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_143","vendedorId":"","nombre":"Motos Giza","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Antofagasta","comuna":"Calama","ciudad":"","dirComercial":"Av. Grecia 2569, Calama, Antofagasta","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8426 7582","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 11 reseñas."},{"id":"prosp_144","vendedorId":"","nombre":"Dabed Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Coquimbo","comuna":"Ovalle","ciudad":"","dirComercial":"Maestranza 443, Local 1, Ovalle, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 53 266 2000","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 42 reseñas."},{"id":"prosp_145","vendedorId":"","nombre":"Moto Lagunas","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Coquimbo","comuna":"Ovalle","ciudad":"","dirComercial":"Av. David Perry 397, Ovalle, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 53 264 4435","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 58 reseñas."},{"id":"prosp_146","vendedorId":"","nombre":"Chico Lalo Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Coquimbo","comuna":"Ovalle","ciudad":"","dirComercial":"Av. La Feria 360, Ovalle, Coquimbo","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8704 9638","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 36 reseñas."},{"id":"prosp_147","vendedorId":"","nombre":"MR Fullmotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Quillota","ciudad":"","dirComercial":"San Martin 22, Quillota, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3735 2453","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 12 reseñas."},{"id":"prosp_148","vendedorId":"","nombre":"Motofactory","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Concesionario"],"region":"Valparaiso","comuna":"Quillota","ciudad":"","dirComercial":"La Concepcion 788, Quillota, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6511 4698","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 3 reseñas."},{"id":"prosp_149","vendedorId":"","nombre":"Motostock Chile","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"Quillota","ciudad":"","dirComercial":"La Concepcion 723, Quillota, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5028 9481","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps)."},{"id":"prosp_150","vendedorId":"","nombre":"B-Dos Ruedas San Antonio","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Valparaiso","comuna":"San Antonio","ciudad":"","dirComercial":"Av. Chile 461, San Antonio, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4898 9628","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.7★, 68 reseñas."},{"id":"prosp_151","vendedorId":"","nombre":"GB Motocicletas","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Valparaiso","comuna":"San Antonio","ciudad":"","dirComercial":"Jose Manuel Balmaceda 395, San Antonio, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 35 236 0227","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.4★, 35 reseñas."},{"id":"prosp_152","vendedorId":"","nombre":"C10Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Valparaiso","comuna":"San Antonio","ciudad":"","dirComercial":"Barros Luco 2123, San Antonio, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4053 8179","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.9★, 16 reseñas."},{"id":"prosp_153","vendedorId":"","nombre":"Sport Moto Club","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Valparaiso","comuna":"San Antonio","ciudad":"","dirComercial":"Libertad 273, San Antonio, Valparaiso","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 35 223 3826","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 33 reseñas."},{"id":"prosp_154","vendedorId":"","nombre":"Motos Inostroza Angol","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Araucania","comuna":"Angol","ciudad":"","dirComercial":"Bernardo O'Higgins 274, Angol, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9992 5200","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.6★, 11 reseñas."},{"id":"prosp_155","vendedorId":"","nombre":"Angol Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Araucania","comuna":"Angol","ciudad":"","dirComercial":"Los Confines 375, Angol, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 45 271 2226","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.1★, 9 reseñas."},{"id":"prosp_156","vendedorId":"","nombre":"Las Rutas de la DT","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Araucania","comuna":"Angol","ciudad":"","dirComercial":"Bernardo O'Higgins 201, Angol, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4261 0340","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 6 reseñas."},{"id":"prosp_157","vendedorId":"","nombre":"Motosport Villarrica","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Araucania","comuna":"Villarrica","ciudad":"","dirComercial":"Saturnino Epulef 1287, Villarrica, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4203 6346","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 35 reseñas."},{"id":"prosp_158","vendedorId":"","nombre":"Vichomotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Araucania","comuna":"Villarrica","ciudad":"","dirComercial":"Colo-Colo 1586, Villarrica, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9841 5208","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 11 reseñas."},{"id":"prosp_159","vendedorId":"","nombre":"VulkanMotos Villarrica","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Araucania","comuna":"Villarrica","ciudad":"","dirComercial":"Villarrica (centro), Villarrica, Araucania","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7650 4103","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 8 reseñas."},{"id":"prosp_160","vendedorId":"","nombre":"Vimoto Chiloe","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Los Lagos","comuna":"Castro","ciudad":"","dirComercial":"Av. Galvarino Riveros 1408, Castro, Los Lagos","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9089 0553","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 5★, 5 reseñas."},{"id":"prosp_161","vendedorId":"","nombre":"Pitts Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Puente Alto","ciudad":"","dirComercial":"Gabriela Pte. 1883, Puente Alto, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5363 2841","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4★, 149 reseñas."},{"id":"prosp_162","vendedorId":"","nombre":"Ultramotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"Puente Alto","ciudad":"","dirComercial":"Av. Concha y Toro 2083, Puente Alto, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 8916 4841","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 135 reseñas."},{"id":"prosp_163","vendedorId":"","nombre":"Pandamotos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Metropolitana","comuna":"Puente Alto","ciudad":"","dirComercial":"Tocornal Grez 094, Puente Alto, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 3922 3132","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.2★, 176 reseñas."},{"id":"prosp_164","vendedorId":"","nombre":"La Baliza Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"Puente Alto","ciudad":"","dirComercial":"Augusto D'halmar 0260, Puente Alto, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 7852 6169","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.6★, 18 reseñas."},{"id":"prosp_165","vendedorId":"","nombre":"Macromoto","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda","Taller"],"region":"Metropolitana","comuna":"San Bernardo","ciudad":"","dirComercial":"Bulnes 1014, San Bernardo, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 4201 4591","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.5★, 182 reseñas."},{"id":"prosp_166","vendedorId":"","nombre":"Manada Store Motorcycle","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"San Bernardo","ciudad":"","dirComercial":"Francisco Aranda 619, San Bernardo, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 6534 9801","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.9★, 16 reseñas."},{"id":"prosp_167","vendedorId":"","nombre":"Misano Motos","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Concesionario"],"region":"Metropolitana","comuna":"San Bernardo","ciudad":"","dirComercial":"Av. Jorge Alessandri 20040, San Bernardo, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 2 2857 8148","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.6★, 14 reseñas."},{"id":"prosp_168","vendedorId":"","nombre":"Beromotos Ltda","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Taller"],"region":"Metropolitana","comuna":"San Bernardo","ciudad":"","dirComercial":"Gran Av. J.M. Carrera 13825, San Bernardo, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 9500 0906","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 3.5★, 63 reseñas."},{"id":"prosp_169","vendedorId":"","nombre":"Accesorios RyK","rut":"","estado":"Prospecto","categoria":"3","tipo":"Tienda de repuestos","segmentos":["Tienda"],"region":"Metropolitana","comuna":"San Bernardo","ciudad":"","dirComercial":"El Barrancon 5913, San Bernardo, Metropolitana","dirDespacho":"","contactoDespacho":"","despacho":"Retiro en tienda","transportadora":"","dirTransportadora":"","contactos":{"compras":"","cobranzas":"","recepcion":""},"telefono":"+56 9 5678 5969","fotoExt":"","fotoInt":"","marcasPropias":[],"marcasComp":"","marketing":[],"capacitaciones":[],"notas":"Prospecto (Google Maps). Rating 4.8★, 16 reseñas."}];
const PROSPECT_VER = 1;
const CLIENT_ASSIGN = {"seed_480":"u_claudio","seed_499":"u_claudio","seed_566":"u_claudio","seed_264":"u_claudio","seed_309":"u_claudio","seed_259":"u_claudio","seed_265":"u_claudio","seed_513":"u_claudio","seed_160":"u_claudio","seed_174":"u_claudio","seed_98":"u_claudio","seed_99":"u_claudio","seed_245":"u_claudio","seed_546":"u_claudio","seed_340":"u_claudio","seed_534":"u_claudio","seed_268":"u_claudio","seed_435":"u_claudio","seed_565":"u_claudio","seed_564":"u_claudio","seed_129":"u_claudio","seed_121":"u_claudio","seed_88":"u_claudio","seed_43":"u_claudio","seed_558":"u_claudio","seed_604":"u_claudio","seed_162":"u_claudio","seed_475":"u_claudio","seed_285":"u_claudio","seed_473":"u_claudio","seed_550":"u_claudio","seed_53":"u_claudio","seed_176":"u_claudio","seed_400":"u_claudio","seed_478":"u_claudio","seed_238":"u_claudio","seed_468":"u_claudio","seed_188":"u_claudio","seed_465":"u_claudio","seed_595":"u_claudio","seed_139":"u_claudio","seed_196":"u_claudio","seed_16":"u_claudio","seed_61":"u_claudio","seed_149":"u_claudio","seed_57":"u_claudio","seed_342":"u_claudio","seed_25":"u_claudio","seed_217":"u_claudio","seed_187":"u_sebastian","seed_397":"u_sebastian","seed_579":"u_sebastian","seed_615":"u_sebastian","seed_1":"u_sebastian","seed_63":"u_sebastian","seed_415":"u_sebastian","seed_221":"u_sebastian","seed_175":"u_sebastian","seed_277":"u_sebastian","seed_279":"u_sebastian","seed_270":"u_sebastian","seed_290":"u_sebastian","seed_508":"u_sebastian","seed_68":"u_sebastian","seed_590":"u_sebastian","seed_32":"u_sebastian","seed_599":"u_sebastian","seed_405":"u_sebastian","seed_511":"u_sebastian","seed_293":"u_sebastian","seed_27":"u_sebastian","seed_407":"u_sebastian","seed_479":"u_sebastian","seed_538":"u_sebastian","seed_431":"u_sebastian","seed_569":"u_sebastian","seed_140":"u_sebastian","seed_202":"u_sebastian","seed_588":"u_sebastian","seed_583":"u_claudio","seed_411":"u_claudio","seed_423":"u_claudio","seed_134":"u_claudio","seed_498":"u_claudio","seed_421":"u_claudio","seed_467":"u_claudio","seed_60":"u_claudio","seed_573":"u_claudio","seed_543":"u_claudio","seed_500":"u_claudio","seed_26":"u_claudio","seed_413":"u_claudio","seed_224":"u_claudio","seed_234":"u_claudio","seed_67":"u_claudio","seed_172":"u_claudio","seed_117":"u_claudio","seed_206":"u_claudio","seed_409":"u_claudio","seed_254":"u_claudio","seed_351":"u_claudio","seed_291":"u_claudio","seed_399":"u_claudio","seed_497":"u_claudio","seed_208":"u_claudio","seed_24":"u_claudio","seed_261":"u_claudio"};
const ASSIGN_VER = 1;
const TEAM = [
  { id: "u_claudio", role: "vendedor", nombre: "Claudio Leclerc", email: "cleclerc@icla.cl", pass: "Icla2974", cargo: "Vendedor en ruta", marcas: ["Ipone"], zonas: { regiones: [], ciudades: [] } },
  { id: "u_sebastian", role: "vendedor", nombre: "Sebastián Agusto", email: "sagusto@icla.cl", pass: "Icla2974", cargo: "Vendedor en ruta", marcas: ["Ipone"], zonas: { regiones: [], ciudades: [] } },
  { id: "u_franco", role: "vendedor", nombre: "Franco Petro", email: "fpetro@icla.cl", pass: "Icla2974", cargo: "Vendedor en ruta", marcas: ["Bridgestone", "Shinko", "Motoz", "Monkey", "Obor"], zonas: { regiones: [], ciudades: [] } },
  { id: "u_fabio", role: "admin", nombre: "Fabio Said", email: "fsaid@icla.cl", pass: "Icla2974", cargo: "Vendedor y administrador", marcas: MARCAS.map((m) => m.n), zonas: { regiones: [], ciudades: [] } },
];
const TEAM_VER = 2;

const PROD_SEED = [
  /* ─── LUBRICANTES IPONE 4T Essential ─── */
  {id:"i01",sku:"IPO-10.3-1L",nombre:"Aceite Ipone 10.3 10W30 Semi Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Essential",descripcion:"Semisintético 4T Essential para uso diario. Compatible con embrague húmedo.",precioBase:16990,stock:400,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/10W-30_1L_E3-scaled-1-247x296.png"},
  {id:"i02",sku:"IPO-10.4-1L",nombre:"Aceite Ipone 10.4 10W40 Semi Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Essential",descripcion:"Semisintético 4T Essential 10W40. El más vendido de la línea Essential.",precioBase:16990,stock:400,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/09/10W-40_10W40_1L_E7-scaled-1-247x296.png"},
  {id:"i03",sku:"IPO-15.5-1L",nombre:"Aceite Ipone 15.5 15W50 Semi Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Essential",descripcion:"Semisintético 4T Essential 15W50. Para climas cálidos y mayor cilindrada.",precioBase:16990,stock:350,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/15W-50_1L_E3-scaled-1-247x296.png"},
  {id:"i04",sku:"IPO-20.5-1L",nombre:"Aceite Ipone 20.5 20W50 Semi Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Essential",descripcion:"Semisintético 4T Essential 20W50. Para motos clásicas y climas tropicales.",precioBase:16990,stock:350,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/20W-50_1L_E3-scaled-1-247x296.png"},
  /* ─── LUBRICANTES IPONE 4T Semi Sintético Plus ─── */
  {id:"i05",sku:"IPO-R4000-10W30",nombre:"Aceite Ipone R4000 RS 10W30 Semi Sintético Plus 1L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"R4000 RS Semi Sintético Plus Advanced. Tecnología estérica para mayor protección.",precioBase:23790,stock:200,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/R4000_10W-30_1L_E2-scaled-1-247x296.png"},
  {id:"i06",sku:"IPO-R4000-10W40",nombre:"Aceite Ipone R4000 RS 10W40 Semi Sintético Plus 1L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"R4000 RS 10W40. El más popular de la gama Plus Advanced.",precioBase:23790,stock:300,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/09/R4000_10W-40_1L_E1_20_281_29-scaled-1-247x296.png"},
  {id:"i07",sku:"IPO-R4000-10W50",nombre:"Aceite Ipone R4000 RS 10W50 Semi Sintético Plus 1L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"R4000 RS 10W50. Para motores de alta cilindrada y uso deportivo.",precioBase:23790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_R4000_RS_15W50_FACE2000x2000_13800077-507d-4267-859a-0d6ffee24914_660x660-1-247x296.png"},
  {id:"i08",sku:"IPO-R4000-15W50",nombre:"Aceite Ipone R4000 RS 15W50 Semi Sintético Plus 1L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"R4000 RS 15W50. Para motores desgastados o climas muy cálidos.",precioBase:23790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_R4000_RS_15W50_FACE2000x2000_13800077-507d-4267-859a-0d6ffee24914_660x660-247x296.png"},
  {id:"i09",sku:"IPO-R4000-60L",nombre:"Tambor Ipone R4000 20W50 Semi Sintético Plus 60L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"Tambor 60 litros R4000 20W50. Para distribuidores y talleres de alto volumen.",precioBase:467990,stock:0,unidad:"Tambor",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/D_670233-MLC50345483419_062022-O-1-247x296.jpg"},
  {id:"i10",sku:"IPO-R4000-220L",nombre:"Tambor Ipone R4000 20W50 Semi Sintético Plus 220L",marca:"Ipone",familia:"Aceite 4T – Semi Sintético Plus",descripcion:"Tambor 220 litros R4000 20W50. Máximo ahorro para distribuidores.",precioBase:1584000,stock:0,unidad:"Tambor",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/D_670233-MLC50345483419_062022-O-247x296.jpg"},
  /* ─── LUBRICANTES IPONE 4T 100% Sintético Road ─── */
  {id:"i11",sku:"IPO-KAT-10W30",nombre:"Aceite Katana 10W30 100% Sintético Éster 1L",marca:"Ipone",familia:"Aceite 4T – 100% Sintético Road",descripcion:"Katana 100% sintético con ésteres. Máxima protección para motos modernas de alto rendimiento.",precioBase:27790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/KATANA_10W-30_1L_E2-scaled-1-247x296.png"},
  {id:"i12",sku:"IPO-KAT-10W40",nombre:"Aceite Katana 10W40 100% Sintético Éster 1L",marca:"Ipone",familia:"Aceite 4T – 100% Sintético Road",descripcion:"Katana 100% sintético 10W40. La gama premium road de Ipone. Para motos 600cc+.",precioBase:27790,stock:0,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/09/KATANA_10W-40_1L_E1_20_281_29-scaled-1-247x296.png"},
  /* ─── LUBRICANTES IPONE 4T Off Road ─── */
  {id:"i13",sku:"IPO-KAT-OR-10W40",nombre:"Katana 10W40 OffRoad 100% Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Off Road",descripcion:"Katana OffRoad 100% sintético 10W40. Diseñado para trabajo exigente en todo terreno.",precioBase:28790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/KATANA_OFFROAD_10W-40_1L_E1-scaled-1-247x296.png"},
  {id:"i14",sku:"IPO-KAT-OR-10W50",nombre:"Katana 10W50 OffRoad 100% Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Off Road",descripcion:"Katana OffRoad 100% sintético 10W50. Para enduro y motocross.",precioBase:28790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/KATANA_OFF_ROAD_10W-50_1L_E2_20_281_29-scaled-1-247x296.png"},
  {id:"i15",sku:"IPO-KAT-OR-10W60",nombre:"Katana 10W60 OffRoad 100% Sintético 1L",marca:"Ipone",familia:"Aceite 4T – Off Road",descripcion:"Katana OffRoad 100% sintético 10W60. La viscosidad más alta para competición extrema.",precioBase:28790,stock:100,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/KATANA_OFF_ROAD_10W-60_1L_E2-scaled-1-247x296.png"},
  /* ─── LUBRICANTES IPONE 4T Racing ─── */
  {id:"i16",sku:"IPO-SHOGUN-10W40",nombre:"Aceite Shogun 10W40 Ipone Racing 1L",marca:"Ipone",familia:"Aceite 4T – Racing",descripcion:"Shogun Racing 100% sintético 10W40. Para competición. Sin aditivos antifricción.",precioBase:38790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/SHOGUN_10W-40_1L_E8-247x296.png"},
  {id:"i17",sku:"IPO-SHOGUN-10W50",nombre:"Aceite Shogun 10W50 Ipone Racing 1L",marca:"Ipone",familia:"Aceite 4T – Racing",descripcion:"Shogun Racing 100% sintético 10W50. Máxima potencia y protección en pista.",precioBase:38790,stock:80,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/SHOGUN_10W-50_1L_E2-247x296.png"},
  {id:"i18",sku:"IPO-SHOGUN-5W40",nombre:"Aceite Shogun 5W40 Ipone Racing 1L",marca:"Ipone",familia:"Aceite 4T – Racing",descripcion:"Shogun Racing 5W40. Arranque en frío instantáneo para competición.",precioBase:38790,stock:80,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/SHOGUN_5W-40_1L_E2-247x296.png"},
  /* ─── LUBRICANTES IPONE 2T ─── */
  {id:"i19",sku:"IPO-SAM-1L",nombre:"Aceite 2T Samouraï Racing 100% Sintético Frutilla 1L",marca:"Ipone",familia:"Aceite 2T",descripcion:"100% sintético con aroma a frutilla. Biodegradable, humo reducido, protección máxima.",precioBase:35790,stock:150,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/09/SAMOURAI_FRAISE_1LD_E1_FRONT_E1-medium-247x296.png"},
  /* ─── IPONE CARE LINE ─── */
  {id:"i20",sku:"IPO-RAD-1L",nombre:"Radiator Liquid – Refrigerante 1L",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Refrigerante especial para motos. Protege el sistema de refrigeración y evita corrosión.",precioBase:16790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_RADIATORLIQUID_FACE_2000x2000_7b0d30e9-476f-4e4a-b7c7-8f4a95b302ca_660x660-247x296.png"},
  {id:"i21",sku:"IPO-FORK-3",nombre:"Fork Fluid 3 – Aceite de horquilla",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Aceite de horquilla viscosidad 3. Para suspensiones de motos de alta performance.",precioBase:24990,stock:50,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_FORK_FLUID_3_FACE_660x660-247x296.png"},
  {id:"i22",sku:"IPO-FORK-5",nombre:"Fork Fluid 5 – Aceite de horquilla",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Aceite de horquilla viscosidad 5. Equilibrio entre suavidad y control.",precioBase:20990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_FORK_5_FACE_660x660-247x296.png"},
  {id:"i23",sku:"IPO-FORK-10",nombre:"Fork Fluid 10 – Aceite de horquilla",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Aceite de horquilla viscosidad 10. El más usado en motos de serie.",precioBase:20990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_FORK_10_FACE_63f38f25-7487-4f0c-a110-15ca3c7f4b26_660x660-247x296.png"},
  {id:"i24",sku:"IPO-FORK-15",nombre:"Fork Fluid 15 – Aceite de horquilla",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Aceite de horquilla viscosidad 15. Para motos de mayor peso.",precioBase:20990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_FORK_15_FACE_d9044235-765b-4831-9ff1-bdb2ffef307a_660x660-247x296.png"},
  {id:"i25",sku:"IPO-FORK-20",nombre:"Fork Fluid 20 – Aceite de horquilla",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Aceite de horquilla viscosidad 20. Para suspensiones de enduro y uso off-road.",precioBase:20990,stock:30,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-1_FORK_20_FACE_98d349e8-cd02-46ec-9126-d4e5ae2a63b9_660x660-247x296.png"},
  {id:"i26",sku:"IPO-CARBU",nombre:"Carbu Cleaner – Limpiador de carburador 500ml",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Spray limpiador de carburador. Disuelve depósitos de combustible y grasas.",precioBase:21990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-N_CARBUCLEANER_FACE2000x2000_660x660-247x296.png"},
  {id:"i27",sku:"IPO-CHAIN-CLN",nombre:"Chain Cleaner – Limpiador de cadena 750ml",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Spray limpiador de cadena. Elimina aceite quemado, barro y residuos. 750ml.",precioBase:23790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-N_CHAIN_CLEANER_FACE2000x2000_660x660-247x296.png"},
  {id:"i28",sku:"IPO-CHROMALU",nombre:"Chrom'Alu – Crema pulidora para metales",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Crema pulidora aluminio, cromo y acero inoxidable. Brillo profesional.",precioBase:17990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-E_CHROMALU_FACE2000x2000_d7726ce8-7672-45c0-9f5d-eb245fe4127c_660x660-247x296.png"},
  {id:"i29",sku:"IPO-CLN-POLISH",nombre:"Cleaner Polish – Cera limpiadora sin agua 400ml",marca:"Ipone",familia:"Ipone Care Line – Moto",descripcion:"Cera limpiadora multi-superficies sin agua. Limpia y protege plásticos, pintura y metales.",precioBase:15990,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/IPONE-N2_CLEANER_POLISH_FACE2000x2000_cddd93cf-c4b6-4024-9689-7f3e9bea2fd1_660x660-247x296.png"},
  /* ─── NEUMÁTICOS Big Trail ─── */
  {id:"n01",sku:"BRG-AT41-11019",nombre:"Battlax AT41 110/80-19 59V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax Adventure Trail AT41 delantero. Excelente en asfalto y tierra.",precioBase:217790,stock:20,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n02",sku:"BRG-AT41-12019",nombre:"Battlax AT41 120/70-19 60V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 delantero 120/70-19. Para adventure de alta cilindrada.",precioBase:227790,stock:15,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n03",sku:"BRG-AT41-13017",nombre:"Battlax AT41 130/80-17 65H Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 trasero 130/80-17. Para motos trail medianas.",precioBase:284790,stock:18,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n04",sku:"BRG-AT41-14017",nombre:"Battlax AT41 140/80-17 69V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 trasero 140/80-17. Para motos adventure de media cilindrada.",precioBase:284790,stock:15,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n05",sku:"BRG-AT41-15017",nombre:"Battlax AT41 150/70-17 69V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 trasero 150/70-17. Para motos adventure 700-900cc.",precioBase:297790,stock:12,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n06",sku:"BRG-AT41-15018",nombre:"Battlax AT41 150/70-18 70V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 trasero 150/70-18. Para GS, Multistrada, Tiger y similares.",precioBase:307790,stock:10,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n07",sku:"BRG-AT41-17017",nombre:"Battlax AT41 170/60-17 72V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 trasero 170/60-17. Para adventure de gran cilindrada.",precioBase:329790,stock:8,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n08",sku:"BRG-AT41-9021",nombre:"Battlax AT41 90/90-21 54V Bridgestone Big Trail",marca:"Bridgestone",familia:"Neumáticos – Big Trail",descripcion:"Battlax AT41 delantero 90/90-21. El formato más popular para ruedas delanteras adventure.",precioBase:197790,stock:20,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-adventure-trail-at41-pair-247x296.png"},
  {id:"n09",sku:"MTZ-ADV-11019",nombre:"Motoz Tractionator Adventure 110/80B-19 Delantera",marca:"Motoz",familia:"Neumáticos – Big Trail",descripcion:"Tractionator Adventure. La mejor opción mixta ruta/tierra para motos trail.",precioBase:184790,stock:15,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/TADVQ21-247x296.png"},
  {id:"n10",sku:"MTZ-ADV-15017",nombre:"Motoz Tractionator Adventure 150/70-17 Trasera",marca:"Motoz",familia:"Neumáticos – Big Trail",descripcion:"Tractionator Adventure trasero 150/70-17.",precioBase:224790,stock:15,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/Motoz-adventure-247x296.png"},
  {id:"n11",sku:"MTZ-OUT-14018",nombre:"Motoz Outback 140/80-18 70R ECER75",marca:"Motoz",familia:"Neumáticos – Big Trail",descripcion:"Outback Race. Neumático homologado ECE R75 para rally raid.",precioBase:202790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2026/06/tractionator_outback_race_1-1-247x296.jpg"},
  /* ─── NEUMÁTICOS Enduro / MX ─── */
  {id:"n12",sku:"BRG-E50-12018",nombre:"Bridgestone E50 120/90-18 65P MC Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross E50 trasero 120/90-18. Para enduro en suelos medios y rocosos.",precioBase:129790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/e50-bridgestone-247x296.png"},
  {id:"n13",sku:"BRG-E50-14018",nombre:"Bridgestone E50 140/80-18 65P MC Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross E50 trasero 140/80-18. La opción premium Bridgestone para enduro.",precioBase:134790,stock:25,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/e50-bridgestone-247x296.png"},
  {id:"n14",sku:"BRG-E50-9021",nombre:"Bridgestone E50 90/90-21 54P MC Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross E50 delantero 90/90-21. Alta tracción frontal para enduro.",precioBase:104790,stock:30,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/e50-bridgestone-247x296.png"},
  {id:"n15",sku:"BRG-X20-11019",nombre:"Bridgestone X20 110/90-19 62M Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross X20 trasero 110/90-19. Agarre extremo en tierra.",precioBase:129790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/X20-Bridgestone-247x296.png"},
  {id:"n16",sku:"BRG-X20-12019",nombre:"Bridgestone X20 120/80-19 63M Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross X20 trasero 120/80-19. Para motocross en suelos sueltos.",precioBase:134790,stock:20,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/X20-Bridgestone-247x296.png"},
  {id:"n17",sku:"BRG-X20-8021",nombre:"Bridgestone X20 80/100-21 51M Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross X20 delantero 80/100-21. El más usado en MX nacional.",precioBase:97790,stock:25,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/X20-Bridgestone-247x296.png"},
  {id:"n18",sku:"BRG-X31-11018",nombre:"Bridgestone X31 110/100-18 64M Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross X31 trasero 110/100-18. Para suelos medios y duros.",precioBase:124790,stock:20,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/X31-Bridgestone-247x296.png"},
  {id:"n19",sku:"BRG-X31-8021",nombre:"Bridgestone X31 80/100-21 51M Battlecross",marca:"Bridgestone",familia:"Neumáticos – Enduro/MX",descripcion:"Battlecross X31 delantero 80/100-21. Para suelos medios y duros.",precioBase:104790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/X31-Bridgestone-247x296.png"},
  {id:"n20",sku:"MTZ-DST-11019",nombre:"Motoz Desert H/T 110/80B-19 59 TL",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Desert H/T. Para terreno árido y pedregoso. Homologado para ruta.",precioBase:204790,stock:10,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2026/06/Tractionator-Desert-HT-1109019-247x296.jpg"},
  {id:"n21",sku:"MTZ-DST-15017",nombre:"Motoz Desert H/T 150/70B-17 69Q TL",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Desert H/T trasero 150/70-17. Rally raid en el desierto.",precioBase:294790,stock:8,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2026/06/TR_150-scaled-1-247x296.jpg"},
  {id:"n22",sku:"MTZ-ENST-12018",nombre:"Motoz Enduro ST 120/90-18 R TT",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Enduro ST trasero 120/90-18. Alta durabilidad y agarre en suelos mixtos.",precioBase:147790,stock:15,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2026/06/5Tractionator_Enduro_ST_130-90-18-2-247x296.jpg"},
  {id:"n23",sku:"MTZ-ENST-14018",nombre:"Motoz Enduro ST 140/80-18 70R TT",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Enduro ST trasero 140/80-18. El más vendido de Motoz para enduro.",precioBase:147790,stock:20,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2026/06/5Tractionator_Enduro_ST_130-90-18-2-247x296.jpg"},
  {id:"n24",sku:"MTZ-ENST-9021",nombre:"Motoz Enduro ST 90/90-21 54R TT",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Enduro ST delantero 90/90-21.",precioBase:97790,stock:20,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2026/06/14Tractionator_Enduro_ST_90-100-21-3-247x296.jpg"},
  {id:"n25",sku:"MTZ-EE6-9021",nombre:"Motoz Euro Enduro 6 90/90-21 54R TT",marca:"Motoz",familia:"Neumáticos – Enduro/MX",descripcion:"Euro Enduro 6 delantero. Con homologación FIM para enduro.",precioBase:97790,stock:15,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2026/06/6Euro_Enduro6_90-90-21-3-247x296.jpg"},
  /* ─── NEUMÁTICOS Sport Urbano / Racing ─── */
  {id:"n26",sku:"BRG-RS10-12017",nombre:"Battlax RS10 120/70-17 58W Bridgestone Sport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax RS10 delantero 120/70-17. Hypersport para pista y calle.",precioBase:149790,stock:15,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-rs10-247x296.png"},
  {id:"n27",sku:"BRG-RS10-18017",nombre:"Battlax RS10 180/55-17 73W Bridgestone Sport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax RS10 trasero 180/55-17. Alta adherencia en mojado.",precioBase:247790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-rs10-247x296.png"},
  {id:"n28",sku:"BRG-RS10-19017",nombre:"Battlax RS10 190/50-17 73W Bridgestone Sport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax RS10 trasero 190/50-17. Para supersport de alta cilindrada.",precioBase:254790,stock:10,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/battlax-rs10-247x296.png"},
  {id:"n29",sku:"BRG-S23-16017",nombre:"Battlax S23 160/60-17 69W Bridgestone Hypersport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax S23 trasero 160/60-17. Equilibrio perfecto sport/touring.",precioBase:209790,stock:12,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/BATTLAX-S23-247x296.png"},
  {id:"n30",sku:"BRG-S23-18017",nombre:"Battlax S23 180/55-17 73W Bridgestone Hypersport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax S23 trasero 180/55-17. Para motos sport 600cc.",precioBase:219790,stock:12,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/10/BATTLAX-S23-247x296.png"},
  {id:"n31",sku:"BRG-S23-19050",nombre:"Battlax S23 190/50-17 73W Bridgestone Hypersport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax S23 trasero 190/50-17. Para motos sport 1000cc.",precioBase:244790,stock:8,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/BATTLAX-S23-247x296.png"},
  {id:"n32",sku:"BRG-S23-19055",nombre:"Battlax S23 190/55-17 75W Bridgestone Hypersport",marca:"Bridgestone",familia:"Neumáticos – Sport Urbano",descripcion:"Battlax S23 trasero 190/55-17. Para superbikes de alta potencia.",precioBase:244790,stock:8,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/10/BATTLAX-S23-247x296.png"},
  {id:"n33",sku:"SHK-016-11017",nombre:"Shinko 016 Racing Verge 110/70/17",marca:"Shinko",familia:"Neumáticos – Sport Urbano",descripcion:"Shinko Racing Verge 016 delantero. Compuesto de alta adherencia para pista.",precioBase:104790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/verge016F-247x296.jpg"},
  {id:"n34",sku:"SHK-016-14017",nombre:"Shinko 016 Racing Verge 140/70/17",marca:"Shinko",familia:"Neumáticos – Sport Urbano",descripcion:"Shinko Racing Verge 016 trasero 140/70-17. Precio competitivo con rendimiento sport.",precioBase:124790,stock:12,unidad:"Un.",activo:true,destacado:true,imagen:"https://icla.cl/wp-content/uploads/2025/09/verge016-1-247x296.jpg"},
  {id:"n35",sku:"SHK-016-15017",nombre:"Shinko 016 Racing Verge 150/60/17",marca:"Shinko",familia:"Neumáticos – Sport Urbano",descripcion:"Shinko Racing Verge 016 trasero 150/60-17. Para naked y sport de mediana cilindrada.",precioBase:144790,stock:0,unidad:"Un.",activo:true,destacado:false,imagen:"https://icla.cl/wp-content/uploads/2025/09/verge016-247x296.jpg"},
];

export default function App() {
  const [users, setUsers, uL] = usePersistent("crm:users", null);
  const [session, setSession, sL] = usePersistent("crm:session", null);
  const [clientes, setClientes, clL] = usePersistent("crm:clientes", []);
  const [visitas, setVisitas] = usePersistent("crm:visitas", []);
  const [rutas, setRutas] = usePersistent("crm:rutas", []);
  const [viajes, setViajes] = usePersistent("crm:viajes", []);
  const [reuniones, setReuniones] = usePersistent("crm:reuniones", []);
  const [precios, setPrecios] = usePersistent("crm:precios", []);
  const [marketing, setMarketing] = usePersistent("crm:marketing", []);
  const [solCap, setSolCap] = usePersistent("crm:solcap", []);
  const [catSolicitudes, setCatSolicitudes] = usePersistent("crm:cat_solicitudes", []);
  const [metas, setMetas] = usePersistent("crm:metas", []);
  const [ventasReales, setVentasReales] = usePersistent("crm:ventas_reales", []);
  const [monitoreo, setMonitoreo] = usePersistent("crm:monitoreo_precios", []);
  const [productos, setProductos] = usePersistent("icla:productos", []);
  const [pedidos, setPedidos] = usePersistent("icla:pedidos", []);
  const [cotizaciones, setCotizaciones] = usePersistent("icla:cotizaciones", []);
  const [descsCat, setDescsCat] = usePersistent("icla:descs_cat", { "1": 25, "2": 20, "3": 15, "4": 10, "5": 0 });
  const [prodSeeded, setProdSeeded] = usePersistent("icla:prod_seeded", false);
  const [seededCli, setSeededCli, scL] = usePersistent("crm:seeded_clientes", false);
  const [teamVer, setTeamVer, stL] = usePersistent("crm:team_ver", 0);
  const [assignVer, setAssignVer, avL] = usePersistent("crm:assign_ver", 0);
  const [extraVer, setExtraVer, evL] = usePersistent("crm:extra_ver", 0);
  const [enrichVer, setEnrichVer, enL] = usePersistent("crm:enrich_ver", 0);
  const [prospVer, setProspVer, pvL] = usePersistent("crm:prosp_ver", 0);

  const [view, setView] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  // Semilla admin inicial
  useEffect(() => {
    if (uL && users === null) {
      setUsers([{
        id: uid(), role: "admin", nombre: "Administrador",
        email: "admin@empresa.cl", pass: "admin123", cargo: "Administrador",
        marcas: MARCAS.map((m) => m.n), zonas: { regiones: [], ciudades: [] },
      }]);
    }
  }, [uL, users]);

  // Carga automática de la lista de clientes (solo la primera vez, si está vacía)
  useEffect(() => {
    if (clL && scL && !seededCli && clientes.length === 0) {
      setClientes(SEED_CLIENTES);
      setSeededCli(true);
    }
  }, [clL, scL, seededCli, clientes]);

  // Carga / actualización del equipo de ventas (por versión; correos y clave inicial)
  useEffect(() => {
    if (!uL || !stL || users === null || teamVer >= TEAM_VER) return;
    const next = [...users];
    TEAM.forEach((t) => {
      const idx = next.findIndex((u) => u.id === t.id);
      if (idx === -1) {
        if (!next.some((u) => u.email.toLowerCase() === t.email.toLowerCase())) next.push(t);
      } else {
        next[idx] = { ...next[idx], email: t.email, pass: t.pass };
      }
    });
    setUsers(next);
    setTeamVer(TEAM_VER);
  }, [uL, stL, users, teamVer]);

  // Asignación de clientes a vendedores según cruce con la lista de Claudio/Sebastián (una vez)
  useEffect(() => {
    if (!clL || !avL || !seededCli || clientes.length === 0 || assignVer >= ASSIGN_VER) return;
    let changed = false;
    const next = clientes.map((c) => {
      const v = CLIENT_ASSIGN[c.id];
      if (v && c.vendedorId !== v) { changed = true; return { ...c, vendedorId: v }; }
      return c;
    });
    if (changed) setClientes(next);
    setAssignVer(ASSIGN_VER);
  }, [clL, avL, seededCli, clientes, assignVer]);

  // Incorporar clientes nuevos del listado de Claudio/Sebastián (una vez, sin duplicar)
  useEffect(() => {
    if (!clL || !evL || !seededCli || extraVer >= EXTRA_VER) return;
    const ruts = new Set(clientes.map((c) => (c.rut || "").replace(/[^0-9kK]/gi, "").toUpperCase()).filter(Boolean));
    const names = new Set(clientes.map((c) => c.nombre.toLowerCase().trim()));
    const add = EXTRA_CLIENTES.filter((c) => {
      const nr = (c.rut || "").replace(/[^0-9kK]/gi, "").toUpperCase();
      if (nr && ruts.has(nr)) return false;
      if (names.has(c.nombre.toLowerCase().trim())) return false;
      return true;
    });
    if (add.length) setClientes((prev) => [...prev, ...add]);
    setExtraVer(EXTRA_VER);
  }, [clL, evL, seededCli, extraVer, clientes]);

  // Enriquecer clientes que calzaron con el archivo de prospectos (solo campos vacíos)
  useEffect(() => {
    if (!clL || !enL || !seededCli || enrichVer >= ENRICH_VER) return;
    let changed = false;
    const next = clientes.map((c) => {
      const e = ENRICH[c.id];
      if (!e) return c;
      const upd = { ...c };
      ["telefono", "dirComercial", "comuna", "region", "notas"].forEach((f) => {
        if (e[f] && !(upd[f] && String(upd[f]).trim())) { upd[f] = e[f]; changed = true; }
      });
      if (e.segmentos && e.segmentos.length && (!upd.segmentos || upd.segmentos.length === 0)) { upd.segmentos = e.segmentos; changed = true; }
      return upd;
    });
    if (changed) setClientes(next);
    setEnrichVer(ENRICH_VER);
  }, [clL, enL, seededCli, enrichVer, clientes]);

  // Agregar los prospectos nuevos del archivo (una vez, sin duplicar por nombre)
  useEffect(() => {
    if (!clL || !pvL || !seededCli || prospVer >= PROSPECT_VER) return;
    const names = new Set(clientes.map((c) => c.nombre.toLowerCase().trim()));
    const add = PROSPECTS.filter((c) => !names.has(c.nombre.toLowerCase().trim()));
    if (add.length) setClientes((prev) => [...prev, ...add]);
    setProspVer(PROSPECT_VER);
  }, [clL, pvL, seededCli, prospVer, clientes]);

  // Semilla de productos ICLA (solo la primera vez)
  useEffect(() => {
    if (prodSeeded || productos.length > 0) return;
    setProductos(PROD_SEED);
    setProdSeeded(true);
  }, [prodSeeded, productos]);

  if (!uL || !sL || users === null) return <Splash />;

  const me = users.find((u) => u.id === session) || null;
  if (!me) return <Login users={users} onLogin={(id) => { setSession(id); setView("dashboard"); }} />;

  const db = {
    users, setUsers, me,
    clientes, setClientes, visitas, setVisitas, rutas, setRutas,
    viajes, setViajes, reuniones, setReuniones,
    precios, setPrecios, marketing, setMarketing, solCap, setSolCap,
    catSolicitudes, setCatSolicitudes,
    metas, setMetas, ventasReales, setVentasReales,
    monitoreo, setMonitoreo,
    productos, setProductos, pedidos, setPedidos, cotizaciones, setCotizaciones,
    descsCat, setDescsCat,
  };
  const acciones = accionesPendientes(db);

  const NAV = {
    admin: [
      ["dashboard", "Mi Día", "▦"], ["clientes", "Clientes", "◍"],
      ["rutas", "Plan Visitas", "⇄"], ["visitas", "Visitas", "✓"],
      ["seguimiento", "Prospectos y Leads", "⟶"], ["precios", "Listas de Precios", "₵"], ["marketing", "Marketing", "◈"],
      ["viajes", "Viajes y fondos", "✈"], ["mercado", "Información del Mercado", "❖"],
      ["competencia", "Monitoreo de Precios", "◭"],
      ["ventas", "Ventas / Tienda", "◉"],
      ["agenda", "Agenda", "▤"], ["riesgo", "Riesgo de Clientes", "⚑"], ["metas", "Metas y Ventas", "✦"],
      ["reportes", "Reportes", "▮"], ["equipo", "Equipo / Admin", "⚙"],
    ],
    vendedor: [
      ["dashboard", "Mi Día", "▦"], ["clientes", "Clientes", "◍"],
      ["rutas", "Plan Visitas", "⇄"], ["visitas", "Visitas", "✓"],
      ["seguimiento", "Prospectos y Leads", "⟶"], ["precios", "Listas de Precios", "₵"], ["marketing", "Marketing", "◈"],
      ["viajes", "Viajes y fondos", "✈"], ["mercado", "Información del Mercado", "❖"],
      ["competencia", "Monitoreo de Precios", "◭"],
      ["ventas", "Ventas / Tienda", "◉"],
      ["agenda", "Agenda", "▤"], ["riesgo", "Riesgo de Clientes", "⚑"], ["metas", "Metas y Ventas", "✦"],
      ["reportes", "Reportes", "▮"],
    ],
    cliente: [
      ["catalogo", "Tienda ICLA", "◉"],
      ["mispedidos", "Mis Pedidos", "▦"],
      ["miscotiz", "Mis Cotizaciones", "▤"],
      ["marketing", "Marketing", "◈"],
    ],
  };
  const nav = NAV[me.role] || [];
  const activeView = nav.some((n) => n[0] === view) ? view : nav[0][0];

  return (
    <div className="app">
      <Styles />
      <aside className={"side" + (navOpen ? " open" : "")}>
        <div className="brand brand-col">
          <IclaLogo h={30} />
          <div className="brand-sub">CRM de terreno · RutaIcla</div>
        </div>
        <nav className="nav">
          {nav.map(([k, label, ico]) => (
            <button key={k} className={"nav-i" + (activeView === k ? " on" : "")}
              onClick={() => { setView(k); setNavOpen(false); }}>
              <span className="nav-ico">{ico}</span>{label}
              {k === "dashboard" && acciones.total > 0 && <span className="nav-badge">{acciones.total}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <div className="me-av">{me.nombre.slice(0, 1).toUpperCase()}</div>
            <div className="me-info">
              <div className="me-n">{me.nombre}</div>
              <div className="me-r">{me.cargo || me.role}</div>
            </div>
          </div>
          <button className="logout" onClick={() => setSession(null)}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="burger" onClick={() => setNavOpen((o) => !o)}>☰</button>
          <div className="topbar-title">{nav.find((n) => n[0] === activeView)?.[1]}</div>
          <div className="topbar-tag">{me.role === "cliente" ? "Acceso cliente" : (me.cargo || me.role)}</div>
        </header>
        <div className="content">
          {activeView === "dashboard" && <Dashboard db={db} go={setView} acciones={acciones} />}
          {activeView === "clientes" && <Clientes db={db} go={setView} />}
          {activeView === "seguimiento" && <Seguimiento db={db} go={setView} />}
          {activeView === "mercado" && <InfoMercado db={db} />}
          {activeView === "ventas" && <Tienda db={db} />}
          {activeView === "catalogo" && <TiendaCliente db={db} initTab="catalogo" />}
          {activeView === "mispedidos" && <TiendaCliente db={db} initTab="mispedidos" />}
          {activeView === "miscotiz" && <TiendaCliente db={db} initTab="miscotiz" />}
          {activeView === "riesgo" && <RiesgoClientes db={db} go={setView} />}
          {activeView === "metas" && <MetasVentas db={db} />}
          {activeView === "competencia" && <MonitoreoPrecios db={db} />}
          {activeView === "rutas" && <Rutas db={db} go={setView} />}
          {activeView === "visitas" && <Visitas db={db} go={setView} />}
          {activeView === "viajes" && <Viajes db={db} />}
          {activeView === "agenda" && <Agenda db={db} />}
          {activeView === "precios" && <Precios db={db} />}
          {activeView === "marketing" && <MarketingMod db={db} />}
          {activeView === "reportes" && <Reportes db={db} />}
          {activeView === "equipo" && <Equipo db={db} />}
        </div>
      </div>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}

const ICLA_LOGO = "data:image/jpeg;base64,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";

/* ---------- Splash / Login ---------- */
function IclaLogo({ h = 38 }) {
  return (
    <span className="logo-chip">
      <img src={ICLA_LOGO} alt="ICLA Motorcycle Products" style={{ height: h, width: "auto", display: "block" }} />
    </span>
  );
}

function Splash() {
  return <div className="splash"><Styles /><IclaLogo h={46} /><p style={{ marginTop: 14 }}>Cargando RutaIcla…</p></div>;
}
function Login({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.pass === pass);
    if (u) onLogin(u.id); else setErr("Correo o contraseña incorrectos.");
  };
  return (
    <div className="login">
      <Styles />
      <div className="login-card">
        <div className="login-brand"><IclaLogo h={56} /></div>
        <p className="login-sub">CRM de terreno para venta de neumáticos y lubricantes de moto en Chile.</p>
        <Field label="Correo">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.cl"
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="Contraseña">
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        {err && <p className="err">{err}</p>}
        <Btn kind="primary" onClick={submit}>Entrar</Btn>
        <p className="login-hint">Demo admin: <b>admin@empresa.cl</b> / <b>admin123</b></p>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard({ db, go, acciones }) {
  const { me, clientes, visitas } = db;
  const [ventaModal, setVentaModal] = useState(false);
  const mine = (arr, key = "vendedorId") =>
    me.role === "admin" ? arr : arr.filter((x) => x[key] === me.id);
  const cl = mine(clientes);
  const vs = mine(visitas).filter((v) => v.estado !== "Programada");
  const visHoy = vs.filter((v) => v.fecha === today()).length;
  const visSem = vs.filter((v) => daysBetween(v.fecha, today()) >= 0 && daysBetween(v.fecha, today()) < 7).length;
  const visMes = vs.filter((v) => v.fecha?.slice(0, 7) === today().slice(0, 7)).length;
  const leads = cl.filter((c) => c.estado === "Lead").length;
  const prospectos = cl.filter((c) => c.estado === "Prospecto").length;
  const cierres = cl.filter((c) => c.estado === "Cliente").length;
  const cliById = (id) => clientes.find((c) => c.id === id);
  const addrOf = (c) => c?.dirComercial || [c?.comuna, c?.region].filter(Boolean).join(", ");
  const hayVisitas = vs.length > 0;

  return (
    <div className="stack">
      <div className="mkt-head">
        <div>
          <h2 className="mkt-h2">¿Qué hacer hoy?</h2>
          <p className="muted small">{acciones.total === 0 ? "No tienes pendientes urgentes — buen momento para prospectar." : acciones.total + " cosa(s) que conviene resolver hoy."}</p>
        </div>
        <button className="vender-btn" onClick={() => setVentaModal(true)}>🛒 Vender</button>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Visitas programadas para hoy <Badge tone={acciones.visHoy.length ? "amber" : "green"}>{acciones.visHoy.length}</Badge></h3>
          <Btn small onClick={() => go("rutas")}>Plan Visitas</Btn>
        </div>
        {acciones.visHoy.length === 0
          ? <Empty icon="✓" title="Sin visitas agendadas para hoy" sub="Arma tu ruta del día desde Plan Visitas." />
          : (
            <div className="rows">
              {acciones.visHoy.map((v) => {
                const c = cliById(v.clienteId);
                return (
                  <div key={v.id} className="row">
                    <div><div className="row-t">{c?.nombre || "—"}</div><div className="row-s">{c?.comuna || "—"}</div></div>
                    <div className="row-actions">
                      {c?.telefono && <WaBtn tel={c.telefono} small />}
                      {addrOf(c) && <>
                        <a className="sel-go waze" href={wazeUrl(addrOf(c), coordOf(c))} target="_blank" rel="noreferrer" title="Waze">W</a>
                        <a className="sel-go maps" href={mapsDir(addrOf(c))} target="_blank" rel="noreferrer" title="Maps">M</a>
                      </>}
                      <Btn small onClick={() => go("visitas")}>Registrar</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Clientes que necesitan seguimiento <Badge tone={acciones.criticos.length ? "red" : acciones.revisitas.length ? "amber" : "green"}>{acciones.revisitas.length}</Badge></h3>
          <Btn small onClick={() => go("riesgo")}>Ver riesgo completo</Btn>
        </div>
        {!hayVisitas
          ? <Empty icon="▤" title="Aún no hay visitas registradas" sub="Cuando registres visitas, aquí verás a quiénes toca revisitar." />
          : acciones.revisitas.length === 0
            ? <Empty icon="✓" title="Todo al día" sub="Ningún cliente visitado lleva más de 15 días sin revisita." />
            : (
              <div className="rows">
                {acciones.revisitas.slice(0, 5).map(({ c, ult, dias }) => (
                  <div key={c.id} className="row">
                    <div>
                      <div className="row-t">{c.nombre}</div>
                      <div className="row-s">{c.comuna || "—"} · última visita: {ult}</div>
                    </div>
                    <Badge tone={dias >= 61 ? "red" : "amber"}>{"hace " + dias + " días"}</Badge>
                  </div>
                ))}
                {acciones.revisitas.length > 5 && <p className="muted small" style={{ marginTop: 4 }}>+ {acciones.revisitas.length - 5} más en Riesgo de Clientes</p>}
              </div>
            )}
      </div>

      <div className="quick-access">
        <button className="qa" onClick={() => go("rutas")}><span className="qa-ico">⇄</span>Plan Visitas</button>
        <button className="qa" onClick={() => go("visitas")}><span className="qa-ico">✓</span>Visitas</button>
        <button className="qa" onClick={() => go("agenda")}><span className="qa-ico">▤</span>Agenda</button>
        <button className="qa" onClick={() => go("riesgo")}><span className="qa-ico">⚑</span>Riesgo de Clientes</button>
        <button className="qa" onClick={() => go("seguimiento")}><span className="qa-ico">⟶</span>Prospectos y Leads</button>
        <button className="qa" onClick={() => go("precios")}><span className="qa-ico">₵</span>Listas de Precios</button>
        <button className="qa" onClick={() => go("mercado")}><span className="qa-ico">❖</span>Info. del Mercado</button>
        <button className="qa" onClick={() => go("viajes")}><span className="qa-ico">✈</span>Viajes y Fondos</button>
        <button className="qa" onClick={() => go("metas")}><span className="qa-ico">✦</span>Metas y Ventas</button>
      </div>

      <div className="card">
        <div className="card-head"><h3>Resumen</h3></div>
        <div className="kpis">
          <Kpi n={visHoy} l="Visitas hoy" />
          <Kpi n={visSem} l="Visitas semana" />
          <Kpi n={visMes} l="Visitas mes" />
          <Kpi n={leads} l="Leads" tone="amber" />
          <Kpi n={prospectos} l="Prospectos" tone="amber" />
          <Kpi n={cierres} l="Clientes" tone="green" />
        </div>
      </div>

      {ventaModal && <VentaRapida db={db} onClose={() => setVentaModal(false)} />}
    </div>
  );
}
function VentaRapida({ db, onClose }) {
  const { me, clientes, productos, pedidos, setPedidos, cotizaciones, setCotizaciones, descsCat } = db;
  const [paso, setPaso] = useState(1);
  const [clienteSel, setClienteSel] = useState(null);
  const [qCli, setQCli] = useState("");
  const [qProd, setQProd] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fFam, setFFam] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [metodo, setMetodo] = useState("Transferencia bancaria");
  const [notas, setNotas] = useState("");
  const [pedidoNum, setPedidoNum] = useState("");
  const [done, setDone] = useState(false);

  const mineClientes = me.role === "admin" ? clientes : clientes.filter((c) => c.vendedorId === me.id);
  const cliFiltrados = mineClientes
    .filter((c) => c.estado !== "Inactivo")
    .filter((c) => !qCli || (c.nombre + " " + (c.razonSocial||"") + " " + c.comuna + " " + c.rut)
      .toLowerCase().includes(qCli.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const cat = clienteSel?.categoria || "5";
  const marcas = [...new Set(productos.filter((p) => p.activo).map((p) => p.marca))].sort();
  const prodFiltrados = productos
    .filter((p) => p.activo)
    .filter((p) => !qProd || (p.nombre + " " + p.sku + " " + p.marca + " " + (p.descripcion || ""))
      .toLowerCase().includes(qProd.toLowerCase()))
    .filter((p) => !fMarca || p.marca === fMarca)
    .filter((p) => !fFam || p.familia === fFam);

  const addCarrito = (prod) => {
    setCarrito((prev) => {
      const ex = prev.find((i) => i.id === prod.id);
      return ex ? prev.map((i) => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...prod, qty: 1 }];
    });
  };
  const qtyTotal = carrito.reduce((s, i) => s + i.qty, 0);
  const totalCarrito = carrito.reduce((s, i) => s + precioCliente(i.precioBase, cat, descsCat) * i.qty, 0);

  const confirmarPedido = () => {
    const items = carrito.map((it) => ({
      productoId: it.id, sku: it.sku, nombre: it.nombre, qty: it.qty,
      precioUnit: precioCliente(it.precioBase, cat, descsCat),
      descPct: Number(descsCat?.[String(cat)] ?? 0),
      total: precioCliente(it.precioBase, cat, descsCat) * it.qty,
    }));
    const num = numPedido(pedidos);
    setPedidos((prev) => [...prev, {
      id: uid(), numero: num,
      clienteId: clienteSel.id, clienteNombre: clienteSel.nombre,
      fecha: today(), estado: "Pendiente",
      items, subtotal: totalCarrito, total: totalCarrito,
      metodoPago: metodo, notas,
      vendedorId: me.id,
    }]);
    setPedidoNum(num);
    setDone(true);
  };

  if (done) return (
    <Modal title="¡Pedido registrado!" onClose={onClose} wide>
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
        <h3 style={{ marginBottom: 4 }}>{pedidoNum}</h3>
        <p className="muted small">Cliente: {clienteSel?.nombre}</p>
        <p className="muted small">Total: {fmtCLP(totalCarrito)} · {metodo}</p>
        <div className="modal-foot"><Btn kind="primary" onClick={onClose}>Cerrar</Btn></div>
      </div>
    </Modal>
  );

  return (
    <Modal title={paso === 1 ? "Vender — Selecciona un cliente" : "Vender a: " + clienteSel?.nombre} onClose={onClose} wide>

      {/* ── PASO 1: seleccionar cliente ── */}
      {paso === 1 && (
        <div>
          <input className="search" style={{ width: "100%", marginBottom: 12 }}
            autoFocus placeholder="Buscar por nombre, RUT, comuna, razón social…"
            value={qCli} onChange={(e) => setQCli(e.target.value)} />
          <div className="rows" style={{ maxHeight: 340, overflowY: "auto" }}>
            {cliFiltrados.length === 0
              ? <Empty icon="◍" title="Sin clientes" sub="Ajusta la búsqueda." />
              : cliFiltrados.map((c) => (
                <div key={c.id} className={"row vr-cli-row" + (clienteSel?.id === c.id ? " vr-sel" : "")}
                  onClick={() => setClienteSel(c)}>
                  <div>
                    <div className="row-t">{c.nombre}</div>
                    <div className="row-s">
                      {[c.razonSocial, c.rut, c.comuna].filter(Boolean).join(" · ")}
                      {" · Cat " + (c.categoria || "5") + " (" + Number(descsCat?.[String(c.categoria||"5")]??0) + "% dcto)"}
                    </div>
                  </div>
                  {clienteSel?.id === c.id && <span style={{ color: "var(--amber)", fontSize: 18 }}>✓</span>}
                </div>
              ))}
          </div>
          <div className="modal-foot">
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn kind="primary" onClick={() => { if (clienteSel) { setPaso(2); setQCli(""); } }} disabled={!clienteSel}>
              Vender a {clienteSel ? clienteSel.nombre : "…"}
            </Btn>
          </div>
        </div>
      )}

      {/* ── PASO 2: catálogo + carrito ── */}
      {paso === 2 && !confirmando && (
        <div>
          <div className="vr-info">
            <span><b>{clienteSel.nombre}</b> · Cat {cat} · {Number(descsCat?.[cat]??0)}% descuento</span>
            <Btn small onClick={() => setPaso(1)}>Cambiar cliente</Btn>
          </div>

          <div className="toolbar" style={{ marginBottom: 8 }}>
            <input className="search" autoFocus placeholder="Buscar código SKU, nombre o medida (ej: 140/80-18)…"
              value={qProd} onChange={(e) => setQProd(e.target.value)} style={{ flex: 2 }} />
            <select value={fMarca} onChange={(e) => setFMarca(e.target.value)}>
              <option value="">Toda marca</option>
              {marcas.map((m) => <option key={m}>{m}</option>)}
            </select>
            <select value={fFam} onChange={(e) => setFFam(e.target.value)}>
              <option value="">Toda familia</option>
              {FAMILIAS_PROD.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
            <div className="rows" style={{ maxHeight: 340, overflowY: "auto", minWidth: 0 }}>
              {prodFiltrados.length === 0
                ? <Empty icon="◉" title="Sin resultados" sub="Ajusta el buscador." />
                : prodFiltrados.map((p) => {
                    const precio = precioCliente(p.precioBase, cat, descsCat);
                    const descPct = Number(descsCat?.[String(cat)] ?? 0);
                    const enCarrito = carrito.find((i) => i.id === p.id);
                    return (
                      <div key={p.id} className="row">
                        <div>
                          <div className="row-t">{p.nombre}</div>
                          <div className="row-s">
                            SKU: {p.sku}{descPct > 0 ? " · Base " + fmtCLP(p.precioBase) + " → " + fmtCLP(precio) : " · " + fmtCLP(precio)}
                            {" · Stock: "}<span style={{ color: p.stock > 0 ? "var(--green)" : "var(--red)" }}>{p.stock > 0 ? p.stock : "Sin stock"}</span>
                          </div>
                        </div>
                        <div className="row-actions">
                          {enCarrito ? (
                            <>
                              <button className="qty-btn" onClick={() => setCarrito((prev) => prev.map((x) => x.id === p.id && x.qty > 1 ? { ...x, qty: x.qty - 1 } : x).filter((x) => x.id !== p.id || x.qty > 0))}>−</button>
                              <b style={{ minWidth: 20, textAlign: "center" }}>{enCarrito.qty}</b>
                              <button className="qty-btn" onClick={() => addCarrito(p)}>+</button>
                            </>
                          ) : (
                            <Btn small kind="primary" onClick={() => addCarrito(p)} disabled={p.stock === 0}>+ Agregar</Btn>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>

            <div style={{ minWidth: 180 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="card-head" style={{ padding: 0, marginBottom: 8 }}><h3 style={{ fontSize: 14 }}>Carrito</h3></div>
                {carrito.length === 0
                  ? <p className="muted small">Sin ítems todavía.</p>
                  : <>
                    {carrito.map((it) => (
                      <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nombre.split(" ").slice(0, 4).join(" ")}…</span>
                        <span style={{ marginLeft: 8, whiteSpace: "nowrap" }}>{it.qty}×{fmtCLP(precioCliente(it.precioBase, cat, descsCat))}</span>
                        <button className="x sm" onClick={() => setCarrito((p) => p.filter((x) => x.id !== it.id))}>✕</button>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8 }}>
                      <b style={{ color: "var(--amber)" }}>{fmtCLP(totalCarrito)}</b>
                      <div className="muted small">{qtyTotal} ítem(s)</div>
                    </div>
                  </>}
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <Btn onClick={() => setPaso(1)}>← Cambiar cliente</Btn>
            <Btn kind="primary" onClick={() => setConfirmando(true)} disabled={carrito.length === 0}>
              Confirmar pedido {carrito.length > 0 ? fmtCLP(totalCarrito) : ""}
            </Btn>
          </div>
        </div>
      )}

      {/* ── PASO 3: confirmar pedido ── */}
      {paso === 2 && confirmando && (
        <div>
          <div className="rows" style={{ marginBottom: 12 }}>
            {carrito.map((it) => {
              const pu = precioCliente(it.precioBase, cat, descsCat);
              return (
                <div key={it.id} className="row">
                  <div><div className="row-t">{it.nombre}</div><div className="row-s">SKU: {it.sku} · {it.qty} {it.unidad} × {fmtCLP(pu)}</div></div>
                  <b>{fmtCLP(pu * it.qty)}</b>
                </div>
              );
            })}
            <div className="row"><b>Total</b><b style={{ color: "var(--amber)", fontSize: 18 }}>{fmtCLP(totalCarrito)}</b></div>
          </div>
          <Field label="Método de pago">
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Notas (dirección de despacho, observaciones)">
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional…" />
          </Field>
          <div className="modal-foot">
            <Btn onClick={() => setConfirmando(false)}>← Volver al catálogo</Btn>
            <Btn kind="primary" onClick={confirmarPedido}>Registrar pedido {fmtCLP(totalCarrito)}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Kpi({ n, l, tone }) {
  return <div className={"kpi kpi-" + (tone || "n")}><div className="kpi-n">{n}</div><div className="kpi-l">{l}</div></div>;
}

/* ---------- Clientes ---------- */
function emptyCliente(me) {
  return {
    id: uid(), vendedorId: me.role === "vendedor" ? me.id : "",
    nombre: "", razonSocial: "", nombreFantasia: "", rut: "", estado: "Lead", categoria: "5", tipo: "Tienda de repuestos",
    segmentos: [], region: "", comuna: "", ciudad: "",
    dirComercial: "", dirDespacho: "", contactoDespacho: "",
    despacho: "Retiro en tienda", transportadora: "", dirTransportadora: "",
    contactos: { compras: "", cobranzas: "", recepcion: "" },
    telefono: "", fotoExt: "", fotoInt: "",
    marcasPropias: [], marcasComp: "",
    marketing: [], capacitaciones: [], notas: "",
    fechaCreacion: today(), fechaConversion: "", origen: "", fase: "",
  };
}
/* ---------- Importación desde planilla ---------- */
const normKey = (s) =>
  String(s || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s.\-/]+/g, "_");

// alias de encabezados -> campo interno
const HEADER_MAP = {
  nombre: "nombre", razon_social: "nombre", cliente: "nombre", tienda: "nombre",
  rut: "rut",
  estado: "estado", etapa: "estado",
  categoria: "categoria", cat: "categoria",
  tipo: "tipo", tipo_cliente: "tipo",
  segmentos: "segmentos", segmento: "segmentos",
  region: "region",
  comuna: "comuna", ciudad: "comuna", comuna_ciudad: "comuna",
  telefono: "telefono", fono: "telefono", whatsapp: "telefono", celular: "telefono",
  dir_comercial: "dirComercial", direccion: "dirComercial", direccion_comercial: "dirComercial",
  dir_despacho: "dirDespacho", direccion_despacho: "dirDespacho",
  contacto_despacho: "contactoDespacho",
  despacho: "despacho", metodo_despacho: "despacho",
  transportadora: "transportadora",
  dir_transportadora: "dirTransportadora", direccion_transportadora: "dirTransportadora",
  compras: "compras", encargado_compras: "compras",
  cobranzas: "cobranzas", encargado_cobranzas: "cobranzas",
  recepcion: "recepcion", recepcion_pedidos: "recepcion", encargado_recepcion: "recepcion",
  marcas_propias: "marcasPropias", marcas: "marcasPropias", marcas_empresa: "marcasPropias",
  marcas_competencia: "marcasComp", competencia: "marcasComp", marcas_competidores: "marcasComp",
};
const splitList = (v) => String(v || "").split(/[,;|]/).map((x) => x.trim()).filter(Boolean);

function rowToCliente(row, me) {
  const base = emptyCliente(me);
  const seg = []; const c = { ...base };
  Object.entries(row).forEach(([rawK, rawV]) => {
    const field = HEADER_MAP[normKey(rawK)];
    if (!field) return;
    const v = String(rawV ?? "").trim();
    if (field === "segmentos") { c.segmentos = splitList(v).filter((s) => SEGMENTOS.includes(s)); }
    else if (field === "marcasPropias") { c.marcasPropias = splitList(v).filter((m) => MARCAS.some((x) => x.n === m)); }
    else if (["compras", "cobranzas", "recepcion"].includes(field)) { c.contactos[field] = v; }
    else { c[field] = v; }
  });
  // normalizaciones suaves
  if (!["Lead", "Prospecto", "Cliente"].includes(c.estado)) c.estado = "Lead";
  if (!CATEGORIAS.includes(String(c.categoria))) c.categoria = "3"; else c.categoria = String(c.categoria);
  if (!TIPOS_CLIENTE.includes(c.tipo)) c.tipo = "Tienda de repuestos";
  if (!["Retiro en tienda", "Reparto propio", "Transportadora"].includes(c.despacho)) c.despacho = "Retiro en tienda";
  return c;
}

async function parseSpreadsheet(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv" || ext === "tsv") {
    return new Promise((res, rej) => {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (r) => res(r.data), error: rej,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function ImportModal({ db, onClose }) {
  const { me, setClientes, users } = db;
  const [stage, setStage] = useState("pick"); // pick | preview | done
  const [parsed, setParsed] = useState([]);
  const [err, setErr] = useState("");
  const [asignar, setAsignar] = useState(me.role === "vendedor" ? me.id : "");
  const vendedores = users.filter((u) => u.role === "vendedor");
  const ref = useRef();

  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setErr("");
    try {
      const rows = await parseSpreadsheet(f);
      const mapped = rows.map((r) => rowToCliente(r, me)).filter((c) => c.nombre);
      if (!mapped.length) { setErr("No se encontraron filas con la columna 'nombre'. Revisa los encabezados."); return; }
      setParsed(mapped); setStage("preview");
    } catch (e2) { setErr("No se pudo leer el archivo. Usa .xlsx o .csv."); }
  };

  const confirmar = () => {
    const conV = parsed.map((c) => ({ ...c, id: uid(), vendedorId: asignar || c.vendedorId }));
    setClientes((prev) => [...prev, ...conV]);
    setStage("done");
  };

  return (
    <Modal wide title="Importar clientes desde planilla" onClose={onClose}>
      {stage === "pick" && (
        <div className="stack">
          <p className="muted small" style={{ margin: 0 }}>
            Acepta archivos <b>.xlsx</b> y <b>.csv</b>. La primera fila debe tener los encabezados
            (nombre, region, comuna, dir_comercial, etc.). Descarga la plantilla si quieres el formato exacto.
          </p>
          <button className="dropzone" onClick={() => ref.current.click()}>
            <div className="dz-ico">⬆</div>
            <div>Haz clic para elegir tu planilla</div>
            <div className="muted small">Excel o CSV</div>
          </button>
          <input ref={ref} type="file" accept=".xlsx,.xls,.csv,.tsv" hidden onChange={onFile} />
          {err && <p className="err">{err}</p>}
          <div className="seed-load">
            <span className="muted small">¿O cargar la lista ya preparada de {SEED_CLIENTES.length} clientes?</span>
            <Btn onClick={() => {
              const ruts = new Set(db.clientes.map((c) => (c.rut || "").trim()).filter(Boolean));
              const nuevos = SEED_CLIENTES.filter((c) => !c.rut || !ruts.has(c.rut.trim()))
                .map((c) => ({ ...c, id: uid() }));
              setClientes((prev) => [...prev, ...nuevos]);
              setParsed(nuevos); setStage("done");
            }}>Cargar lista preparada</Btn>
          </div>
        </div>
      )}

      {stage === "preview" && (
        <div className="stack">
          <div className="row" style={{ background: "transparent", border: 0, padding: 0 }}>
            <div><b>{parsed.length}</b> clientes detectados.</div>
          </div>
          {me.role === "admin" && (
            <Field label="Asignar todos a un vendedor (opcional)">
              <select value={asignar} onChange={(e) => setAsignar(e.target.value)}>
                <option value="">— Mantener sin asignar —</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Field>
          )}
          <div className="prev-wrap">
            <table className="prev">
              <thead><tr><th>Nombre</th><th>Estado</th><th>Cat.</th><th>Comuna</th><th>Segmentos</th><th>Marcas</th></tr></thead>
              <tbody>
                {parsed.slice(0, 20).map((c, i) => (
                  <tr key={i}>
                    <td>{c.nombre}</td><td>{c.estado}</td><td>{c.categoria}</td>
                    <td>{c.comuna || "—"}</td><td>{c.segmentos.join(", ") || "—"}</td>
                    <td>{c.marcasPropias.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && <div className="muted small" style={{ padding: "8px 0" }}>… y {parsed.length - 20} más.</div>}
          </div>
          <div className="modal-foot">
            <Btn onClick={() => setStage("pick")}>Atrás</Btn>
            <Btn kind="primary" onClick={confirmar}>Importar {parsed.length} clientes</Btn>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="stack">
          <Empty icon="✓" title={parsed.length + " clientes importados"} sub="Ya aparecen en tu lista y se guardaron en la app." />
          <div className="modal-foot"><Btn kind="primary" onClick={onClose}>Listo</Btn></div>
        </div>
      )}
    </Modal>
  );
}

function ExportModal({ rows, onClose }) {
  const headers = Object.keys(rows[0] || {});
  const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const csv = useMemo(
    () => [headers.map(esc).join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n"),
    [rows]
  );
  const [msg, setMsg] = useState("");
  const taRef = useRef();
  const copiar = async () => {
    try { await navigator.clipboard.writeText(csv); setMsg("Copiado al portapapeles ✓ — pégalo en una hoja de Excel o Google Sheets."); }
    catch {
      try { taRef.current.select(); document.execCommand("copy"); setMsg("Copiado ✓ — pégalo en Excel o Google Sheets."); }
      catch { setMsg("Selecciona todo el texto de abajo y cópialo (Ctrl/Cmd + C)."); }
    }
  };
  const descargar = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "clientes-icla-" + today() + ".xlsx";
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
      setMsg("Si tu navegador permite descargas, ya se descargó el archivo. Si no pasó nada, usa “Copiar” y pega el texto en Excel.");
    } catch (e) { setMsg("No se pudo generar la descarga: " + (e?.message || e)); }
  };
  return (
    <Modal wide title={"Exportar " + rows.length + " clientes"} onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>
        Descarga el Excel, o copia el texto y pégalo directo en Excel / Google Sheets (separado por punto y coma).
      </p>
      <div className="row-actions" style={{ marginBottom: 10, justifyContent: "flex-start" }}>
        <Btn kind="primary" onClick={descargar}>⬇ Descargar Excel (.xlsx)</Btn>
        <Btn onClick={copiar}>📋 Copiar para pegar en Excel</Btn>
      </div>
      {msg && <p className="muted small">{msg}</p>}
      <textarea ref={taRef} readOnly value={csv} rows={12}
        onFocus={(e) => e.target.select()} style={{ fontFamily: "monospace", fontSize: 12 }} />
    </Modal>
  );
}

function Clientes({ db, go }) {
  const { me, clientes, setClientes, users } = db;
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exportRows, setExportRows] = useState(null);
  const [q, setQ] = useState("");
  const visibles = clientes.filter((c) => me.role === "admin" || c.vendedorId === me.id)
    .filter((c) => c.estado !== "Prospecto")
    .filter((c) => !q || (c.nombre + " " + (c.razonSocial || "") + " " + (c.nombreFantasia || "") + " " + c.comuna + " " + c.ciudad).toLowerCase().includes(q.toLowerCase()));

  const save = (c) => {
    setClientes((prev) => prev.some((x) => x.id === c.id) ? prev.map((x) => x.id === c.id ? c : x) : [...prev, c]);
    setEditing(null);
  };

  const exportar = () => {
    if (visibles.length === 0) { alert("No hay clientes para exportar."); return; }
    const rows = visibles.map((c) => ({
      nombre: c.nombre, rut: c.rut, razon_social: c.razonSocial || "", nombre_fantasia: c.nombreFantasia || "",
      estado: c.estado, categoria: c.categoria, tipo: c.tipo,
      segmentos: (c.segmentos || []).join(", "), region: c.region, comuna: c.comuna, telefono: c.telefono,
      dir_comercial: c.dirComercial, dir_despacho: c.dirDespacho, contacto_despacho: c.contactoDespacho,
      despacho: c.despacho, transportadora: c.transportadora, dir_transportadora: c.dirTransportadora,
      compras: c.contactos?.compras || "", cobranzas: c.contactos?.cobranzas || "", recepcion: c.contactos?.recepcion || "",
      marcas_propias: (c.marcasPropias || []).join(", "), marcas_competencia: c.marcasComp,
      vendedor: users.find((u) => u.id === c.vendedorId)?.nombre || "",
    }));
    setExportRows(rows);
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <input className="search" placeholder="Buscar cliente, comuna o ciudad…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Btn onClick={exportar}>⬇ Exportar</Btn>
        <Btn onClick={() => setImporting(true)}>⬆ Importar planilla</Btn>
        <Btn kind="primary" onClick={() => setEditing(emptyCliente(me))}>+ Nuevo cliente</Btn>
      </div>
      {visibles.length === 0
        ? <Empty icon="◍" title="Sin clientes todavía" sub="Registra tu primera tienda, concesionario o taller." />
        : (
          <div className="cards-grid">
            {visibles.map((c) => (
              <div key={c.id} className="cli-card" onClick={() => setEditing(c)}>
                <div className="cli-top">
                  <div className="cli-name">{c.nombre}</div>
                  <Badge tone={c.estado === "Cliente" ? "green" : c.estado === "Prospecto" ? "amber" : "n"}>{c.estado}</Badge>
                </div>
                <div className="cli-meta">Cat {c.categoria} · {CAT_LABELS[c.categoria] || ""}</div>
                <div className="cli-meta">{c.tipo} · {[c.comuna, c.region].filter(Boolean).join(", ") || "Sin zona"}</div>
                <div className="cli-segs">{c.segmentos.map((s) => <Badge key={s}>{s}</Badge>)}</div>
                <div className="cli-actions" onClick={(e) => e.stopPropagation()}>
                  {c.telefono && <WaBtn tel={c.telefono} small />}
                  {c.dirComercial && <>
                    <Btn small as="a" href={wazeUrl(c.dirComercial, coordOf(c))} kind="waze">Waze</Btn>
                    <Btn small as="a" href={mapsDir(c.dirComercial)} kind="maps">Maps</Btn>
                  </>}
                </div>
              </div>
            ))}
          </div>
        )}
      {editing && <ClienteForm cliente={editing} onSave={save} onClose={() => setEditing(null)} db={db} go={go} />}
      {importing && <ImportModal db={db} onClose={() => setImporting(false)} />}
      {exportRows && <ExportModal rows={exportRows} onClose={() => setExportRows(null)} />}
    </div>
  );
}

function splitComp(s) { return String(s || "").split(/[,;|]/).map((x) => x.trim()).filter(Boolean); }
function mergeClients(survivor, victim) {
  const m = { ...survivor };
  ["rut", "telefono", "dirComercial", "dirDespacho", "contactoDespacho", "comuna", "region", "ciudad",
    "despacho", "transportadora", "dirTransportadora", "fotoExt", "fotoInt"].forEach((f) => {
    if (!(m[f] && String(m[f]).trim()) && victim[f]) m[f] = victim[f];
  });
  const rank = { Cliente: 3, Prospecto: 2, Lead: 1 };
  if ((rank[victim.estado] || 0) > (rank[m.estado] || 0)) m.estado = victim.estado;
  if (!m.vendedorId && victim.vendedorId) m.vendedorId = victim.vendedorId;
  m.contactos = {
    compras: m.contactos?.compras || victim.contactos?.compras || "",
    cobranzas: m.contactos?.cobranzas || victim.contactos?.cobranzas || "",
    recepcion: m.contactos?.recepcion || victim.contactos?.recepcion || "",
  };
  m.segmentos = [...new Set([...(m.segmentos || []), ...(victim.segmentos || [])])];
  m.marcasPropias = [...new Set([...(m.marcasPropias || []), ...(victim.marcasPropias || [])])];
  m.marcasComp = [...new Set([...splitComp(m.marcasComp), ...splitComp(victim.marcasComp)])].join(", ");
  m.marketing = [...(m.marketing || []), ...(victim.marketing || [])];
  m.capacitaciones = [...(m.capacitaciones || []), ...(victim.capacitaciones || [])];
  // Nombre fusionado: mostrar ambos si difieren (razón social + nombre de fantasía)
  const ns = (survivor.nombre || "").trim(), nv = (victim.nombre || "").trim();
  if (nv && nv.toLowerCase() !== ns.toLowerCase() && !ns.toLowerCase().includes(nv.toLowerCase()))
    m.nombre = ns + " (" + nv + ")";
  // Nota de fusión
  const fusionNota = "Fusionado con: " + nv + (victim.rut ? " (RUT " + victim.rut + ")" : "") + " — " + today();
  m.notas = [m.notas, victim.notas, fusionNota].filter(Boolean).join(" | ");
  return m;
}

function MergeModal({ base, db, onCancel, onMerged }) {
  const { me, clientes, setClientes, setVisitas, setRutas } = db;
  const [otroId, setOtroId] = useState("");
  const [keep, setKeep] = useState("base");
  const [q, setQ] = useState("");
  const candidatos = clientes
    .filter((c) => c.id !== base.id && (me.role === "admin" || c.vendedorId === me.id || !c.vendedorId))
    .filter((c) => !q || c.nombre.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 40);
  const otro = clientes.find((c) => c.id === otroId);
  // sugerir conservar el que tiene RUT
  useEffect(() => {
    if (!otro) return;
    if (base.rut && !otro.rut) setKeep("base");
    else if (!base.rut && otro.rut) setKeep("otro");
  }, [otroId]); // eslint-disable-line

  const fusionar = () => {
    if (!otro) return;
    const survivor = keep === "base" ? base : otro;
    const victim = keep === "base" ? otro : base;
    const merged = mergeClients(survivor, victim);
    setClientes((prev) => prev.map((x) => x.id === survivor.id ? merged : x).filter((x) => x.id !== victim.id));
    setVisitas((prev) => prev.map((v) => v.clienteId === victim.id ? { ...v, clienteId: survivor.id } : v));
    setRutas((prev) => prev.map((r) => ({
      ...r, clienteIds: [...new Set((r.clienteIds || []).map((id) => id === victim.id ? survivor.id : id))],
    })));
    onMerged();
  };

  return (
    <Modal wide title="Fusionar con otro registro" onClose={onCancel}>
      <p className="muted small" style={{ marginTop: 0 }}>
        Combina este registro con un duplicado (ej. razón social + nombre de fantasía). Se rellenan los datos vacíos,
        se unen marcas y segmentos, y las visitas del eliminado se reasignan al que conservas.
      </p>
      <Field label="Registro actual"><input value={base.nombre + (base.rut ? "  ·  " + base.rut : "")} disabled /></Field>
      <Field label="Buscar el registro duplicado">
        <input className="search" placeholder="Nombre del otro registro…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Field>
      <div className="cli-results" style={{ maxHeight: 200 }}>
        {candidatos.length === 0 ? <div className="cli-none">Sin coincidencias.</div> :
          candidatos.map((c) => (
            <button key={c.id} className={"cli-res" + (otroId === c.id ? " on" : "")} onClick={() => setOtroId(c.id)}>
              <span className="cli-res-n">{c.nombre}</span>
              <span className="cli-res-s">{[c.rut, c.comuna, c.estado].filter(Boolean).join(" · ")}</span>
              <span className="cli-res-add">{otroId === c.id ? "✓" : "elegir"}</span>
            </button>
          ))}
      </div>
      {otro && (
        <div style={{ marginTop: 14 }}>
          <Field label="¿Cuál registro conservar? (el otro se elimina)">
            <div className="seg">
              <button className={"seg-b" + (keep === "base" ? " on" : "")} onClick={() => setKeep("base")}>{base.nombre}</button>
              <button className={"seg-b" + (keep === "otro" ? " on" : "")} onClick={() => setKeep("otro")}>{otro.nombre}</button>
            </div>
          </Field>
        </div>
      )}
      <div className="modal-foot">
        <Btn onClick={onCancel}>Cancelar</Btn>
        <Btn kind="primary" onClick={fusionar} disabled={!otro}>Fusionar registros</Btn>
      </div>
    </Modal>
  );
}

function ClienteForm({ cliente, onSave, onClose, db, go }) {
  const { me, users, setCatSolicitudes } = db;
  const [c, setC] = useState(cliente);
  const [tab, setTab] = useState("datos");
  const [merging, setMerging] = useState(false);
  const [solicitandoCat, setSolicitandoCat] = useState(false);
  const [catPedida, setCatPedida] = useState(c.categoria);
  const [catMotivo, setCatMotivo] = useState("");
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const vendedores = users.filter((u) => u.role === "vendedor");
  const enviarSolicitudCat = () => {
    if (catPedida === c.categoria || !catMotivo.trim()) return;
    setCatSolicitudes((prev) => [...prev, {
      id: uid(), clienteId: c.id, clienteNombre: c.nombre, categoriaActual: c.categoria, categoriaSolicitada: catPedida,
      motivo: catMotivo.trim(), vendedorId: me.id, vendedorNombre: me.nombre, fecha: today(), estado: "Pendiente",
    }]);
    setSolicitandoCat(false); setCatMotivo("");
  };
  const guardar = () => {
    let out = { ...c };
    if (!out.fechaCreacion) out.fechaCreacion = today();
    if (out.estado === "Cliente" && cliente.estado !== "Cliente" && !out.fechaConversion) out.fechaConversion = today();
    if (out.estado !== "Cliente") out.fechaConversion = "";
    onSave(out);
  };

  // marketing item temporal
  const [mkt, setMkt] = useState({ tipo: ACCIONES_MKT[0], valor: "", fecha: today(), detalle: "" });
  const [cap, setCap] = useState({ marca: MARCAS[0].n, fecha: today(), modo: MODOS_CAP[0], tema: "" });

  const addMkt = () => { if (mkt.valor || mkt.detalle) { set("marketing", [...c.marketing, { ...mkt, id: uid() }]); setMkt({ tipo: ACCIONES_MKT[0], valor: "", fecha: today(), detalle: "" }); } };
  const addCap = () => { if (cap.tema) { set("capacitaciones", [...c.capacitaciones, { ...cap, id: uid() }]); setCap({ marca: MARCAS[0].n, fecha: today(), modo: MODOS_CAP[0], tema: "" }); } };

  const pickPhoto = async (e, field) => {
    const f = e.target.files?.[0]; if (!f) return;
    const data = await resizeImage(f); set(field, data);
  };

  const TABS = [["datos", "Datos"], ["direcciones", "Direcciones y despacho"], ["contactos", "Contactos"], ["marcas", "Marcas"], ["mkt", "Marketing"], ["cap", "Capacitaciones"]];

  return (
    <Modal wide title={c.nombre || "Nuevo cliente"} onClose={onClose}>
      <div className="tabs">
        {TABS.map(([k, l]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "datos" && (
        <div className="grid2">
          <Field label="Nombre (cómo se muestra)"><input value={c.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
          <Field label="RUT"><input value={c.rut} onChange={(e) => set("rut", e.target.value)} /></Field>
          <Field label="Razón social"><input value={c.razonSocial || ""} onChange={(e) => set("razonSocial", e.target.value)} /></Field>
          <Field label="Nombre de fantasía"><input value={c.nombreFantasia || ""} onChange={(e) => set("nombreFantasia", e.target.value)} /></Field>

          <div className="full" style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, marginTop: 4 }}>
            <p className="muted small" style={{ marginTop: 0, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>
              Recorrido comercial: primer contacto → origen → tipo → estado → seguimiento → ventas
            </p>
          </div>
          <Field label="Fecha de alta (primer contacto)" hint="Cuándo se registró como lead/prospecto/cliente. Editable si no quedó registrada automáticamente.">
            <input type="date" value={c.fechaCreacion || ""} onChange={(e) => set("fechaCreacion", e.target.value)} />
          </Field>
          <Field label="Origen del contacto" hint="Al elegirlo, se sugiere automáticamente su etapa de calificación (Lead/MQL/SQL).">
            <select value={c.origen || ""} onChange={(e) => {
              const origen = e.target.value;
              setC((p) => ({ ...p, origen, fase: p.estado === "Cliente" ? p.fase : (ORIGEN_FASE_MAP[origen] || p.fase) }));
            }}>
              <option value="">Sin especificar</option>
              {ORIGENES_LEAD.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Tipo de cliente">
            <select value={c.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {TIPOS_CLIENTE.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Estado (embudo)" hint={c.estado === "Cliente" ? "Cliente (ya cerrado)" : "Etapa sugerida por el origen: " + (ORIGEN_FASE_MAP[c.origen] ? ORIGEN_FASE_MAP[c.origen] : "Lead (ajústala en Avance de Leads)")}>
            <select value={c.estado} onChange={(e) => set("estado", e.target.value)}>
              {["Lead", "Prospecto", "Cliente"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="full">
            <p className="muted small" style={{ marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px" }}>Seguimiento — progreso del cliente</p>
            <div className="card mini-progress">
              <div className="stepper">
                {FASES_LEAD.map((et, i) => {
                  const faseActual = faseDe(c);
                  const etapaIdx = FASES_LEAD.indexOf(faseActual);
                  return (
                    <React.Fragment key={et}>
                      <div className={"step" + (i <= etapaIdx ? " done" : "") + (i === etapaIdx ? " current" : "")}>
                        <span className="step-dot">{i < etapaIdx ? "✓" : i + 1}</span>
                        <span className="step-label">{et}</span>
                        <span className="step-date">
                          {et === "Lead" ? (c.fechaCreacion || "—") : et === "Cliente" ? (c.fechaConversion || (i <= etapaIdx ? "—" : "")) : ""}
                        </span>
                      </div>
                      {i < FASES_LEAD.length - 1 && <span className={"step-line" + (i < etapaIdx ? " done" : "")} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <Btn onClick={() => { if (go) go("seguimiento"); onClose(); }} disabled={!go} style={{ marginTop: 12 }}>⟶ Ir a Leads / Prospectos</Btn>
            </div>
          </div>
          <Field label="Ventas — fecha de conversión a cliente" hint="Se completa solo cuando se registra la venta/conversión; no es editable a mano.">
            <input value={c.estado === "Cliente" ? (c.fechaConversion || "Sin registro") : "Aún no aplica"} disabled />
          </Field>
          <div className="full" style={{ borderBottom: "1px dashed var(--line)", paddingBottom: 4 }} />
          {me.role === "admin" &&
            <Field label="Vendedor asignado">
              <select value={c.vendedorId} onChange={(e) => set("vendedorId", e.target.value)}>
                <option value="">— Sin asignar —</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Field>}
          <Field label="Categoría (límite de crédito)" hint={me.role === "admin" ? "Como admin, puedes cambiarla directo." : "Solo el admin puede autorizar cambios — usa «Solicitar cambio»."}>
            {me.role === "admin"
              ? <select value={c.categoria} onChange={(e) => set("categoria", e.target.value)}>
                  {CATEGORIAS.map((x) => <option key={x} value={x}>{"Cat " + x + " — " + CAT_LABELS[x]}</option>)}
                </select>
              : <input value={"Cat " + c.categoria + " — " + CAT_LABELS[c.categoria]} disabled />}
          </Field>
          {me.role !== "admin" && (
            <div className="full">
              {!solicitandoCat
                ? <Btn small onClick={() => { setCatPedida(c.categoria); setSolicitandoCat(true); }}>Solicitar cambio de categoría</Btn>
                : (
                  <div className="card" style={{ padding: 12 }}>
                    <div className="grid2">
                      <Field label="Nueva categoría solicitada">
                        <select value={catPedida} onChange={(e) => setCatPedida(e.target.value)}>
                          {CATEGORIAS.map((x) => <option key={x} value={x}>{"Cat " + x + " — " + CAT_LABELS[x]}</option>)}
                        </select>
                      </Field>
                      <Field label="Motivo"><input value={catMotivo} onChange={(e) => setCatMotivo(e.target.value)} placeholder="Por qué se justifica el cambio…" /></Field>
                    </div>
                    <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
                      <Btn small onClick={() => setSolicitandoCat(false)}>Cancelar</Btn>
                      <Btn small kind="primary" onClick={enviarSolicitudCat} disabled={catPedida === c.categoria || !catMotivo.trim()}>Enviar solicitud al admin</Btn>
                    </div>
                  </div>
                )}
            </div>
          )}
          <Field label="Teléfono / WhatsApp"><input value={c.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+56 9 …" /></Field>
          <div className="full">
            <Field label="Segmento (puedes elegir más de uno)">
              <MultiChips options={SEGMENTOS} value={c.segmentos} onChange={(v) => set("segmentos", v)} />
            </Field>
          </div>
          <Field label="Región">
            <select value={c.region} onChange={(e) => { set("region", e.target.value); set("comuna", ""); }}>
              <option value="">—</option>
              {Object.keys(REGIONES).map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Comuna / Ciudad">
            <select value={c.comuna} onChange={(e) => set("comuna", e.target.value)}>
              <option value="">—</option>
              {(REGIONES[c.region] || []).map((co) => <option key={co}>{co}</option>)}
            </select>
          </Field>
          <div className="full">
            <Field label="Marcas que vende (de la empresa)" hint="Marca las que el cliente comercializa de ICLA.">
              <MultiChips options={MARCAS.map((m) => m.n)} value={c.marcasPropias} onChange={(v) => set("marcasPropias", v)} />
            </Field>
          </div>
          <div className="full">
            <Field label="Notas" hint="Información extra: rating Google, fuente, próxima acción, etc.">
              <textarea rows={2} value={c.notas || ""} onChange={(e) => set("notas", e.target.value)} />
            </Field>
          </div>
          <div className="full photos">
            <PhotoBox label="Foto fachada externa" data={c.fotoExt} onPick={(e) => pickPhoto(e, "fotoExt")} />
            <PhotoBox label="Foto interior" data={c.fotoInt} onPick={(e) => pickPhoto(e, "fotoInt")} />
          </div>
        </div>
      )}

      {tab === "direcciones" && (
        <div className="grid2">
          <div className="full"><Field label="Dirección comercial"><input value={c.dirComercial} onChange={(e) => set("dirComercial", e.target.value)} placeholder="Calle, número, comuna" /></Field></div>
          <div className="full"><Field label="Dirección de despacho"><input value={c.dirDespacho} onChange={(e) => set("dirDespacho", e.target.value)} /></Field></div>
          <div className="full"><Field label="Contacto que recibe en despacho"><input value={c.contactoDespacho} onChange={(e) => set("contactoDespacho", e.target.value)} placeholder="Nombre y teléfono" /></Field></div>
          <Field label="Método de despacho">
            <select value={c.despacho} onChange={(e) => set("despacho", e.target.value)}>
              {["Retiro en tienda", "Reparto propio", "Transportadora"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          {c.despacho === "Transportadora" && <>
            <Field label="Transportadora">
              <select value={c.transportadora} onChange={(e) => set("transportadora", e.target.value)}>
                <option value="">—</option>
                {TRANSPORTADORAS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="full"><Field label="Dirección de la transportadora donde dejar la carga"><input value={c.dirTransportadora} onChange={(e) => set("dirTransportadora", e.target.value)} /></Field></div>
          </>}
          {c.dirComercial && <div className="full route-btns">
            <Btn as="a" href={wazeUrl(c.dirComercial, coordOf(c))} kind="waze">Ir con Waze</Btn>
            <Btn as="a" href={mapsDir(c.dirComercial)} kind="maps">Ir con Maps</Btn>
          </div>}
        </div>
      )}

      {tab === "contactos" && (
        <div className="grid2">
          <div className="contact-row">
            <Field label="Encargado de compras"><input value={c.contactos.compras} onChange={(e) => set("contactos", { ...c.contactos, compras: e.target.value })} /></Field>
            <WaBtn tel={c.telefono} />
          </div>
          <div className="contact-row">
            <Field label="Encargado de cobranzas"><input value={c.contactos.cobranzas} onChange={(e) => set("contactos", { ...c.contactos, cobranzas: e.target.value })} /></Field>
            <WaBtn tel={c.telefono} />
          </div>
          <div className="contact-row">
            <Field label="Encargado de recibir pedidos"><input value={c.contactos.recepcion} onChange={(e) => set("contactos", { ...c.contactos, recepcion: e.target.value })} /></Field>
            <WaBtn tel={c.telefono} />
          </div>
          <Field label="Teléfono / WhatsApp general">
            <div className="row-actions" style={{ gap: 8 }}>
              <input value={c.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+56 9 …" style={{ flex: 1 }} />
              <WaBtn tel={c.telefono} />
            </div>
          </Field>
        </div>
      )}

      {tab === "marcas" && (
        <div className="stack">
          <Field label="Marcas de la empresa que vende" hint="También editable desde la pestaña Datos.">
            <MultiChips options={MARCAS.map((m) => m.n)} value={c.marcasPropias} onChange={(v) => set("marcasPropias", v)} />
          </Field>
          <Field label="Marcas de la competencia que comercializa" hint="Neumáticos y lubricantes para moto importados a Chile (texto libre, separar por coma)">
            <textarea rows={3} value={c.marcasComp} onChange={(e) => set("marcasComp", e.target.value)} placeholder="Ej: Pirelli, Motul, Michelin, Vee Rubber…" />
          </Field>
        </div>
      )}

      {tab === "mkt" && (
        <div className="stack">
          <div className="subform">
            <Field label="Acción"><select value={mkt.tipo} onChange={(e) => setMkt({ ...mkt, tipo: e.target.value })}>{ACCIONES_MKT.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Valor (CLP)"><input type="number" value={mkt.valor} onChange={(e) => setMkt({ ...mkt, valor: e.target.value })} /></Field>
            <Field label="Fecha"><input type="date" value={mkt.fecha} onChange={(e) => setMkt({ ...mkt, fecha: e.target.value })} /></Field>
            <Field label="Detalle"><input value={mkt.detalle} onChange={(e) => setMkt({ ...mkt, detalle: e.target.value })} /></Field>
            <Btn kind="primary" onClick={addMkt}>Agregar</Btn>
          </div>
          {c.marketing.length === 0 ? <Empty icon="◈" title="Sin acciones de marketing" /> :
            <div className="rows">
              {c.marketing.map((m) => (
                <div key={m.id} className="row">
                  <div><div className="row-t">{m.tipo} — {fmtCLP(m.valor)}</div><div className="row-s">{m.fecha} · {m.detalle}</div></div>
                  <button className="x sm" onClick={() => set("marketing", c.marketing.filter((x) => x.id !== m.id))}>✕</button>
                </div>
              ))}
              <div className="total">Total marketing ofrecido: <b>{fmtCLP(c.marketing.reduce((s, m) => s + Number(m.valor || 0), 0))}</b></div>
            </div>}
        </div>
      )}

      {tab === "cap" && (
        <div className="stack">
          <div className="subform">
            <Field label="Marca"><select value={cap.marca} onChange={(e) => setCap({ ...cap, marca: e.target.value })}>{MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}</select></Field>
            <Field label="Modo"><select value={cap.modo} onChange={(e) => setCap({ ...cap, modo: e.target.value })}>{MODOS_CAP.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Fecha"><input type="date" value={cap.fecha} onChange={(e) => setCap({ ...cap, fecha: e.target.value })} /></Field>
            <Field label="Tema"><input value={cap.tema} onChange={(e) => setCap({ ...cap, tema: e.target.value })} /></Field>
            <Btn kind="primary" onClick={addCap}>Agregar</Btn>
          </div>
          {c.capacitaciones.length === 0 ? <Empty icon="◈" title="Sin capacitaciones registradas" /> :
            <div className="rows">
              {c.capacitaciones.map((m) => (
                <div key={m.id} className="row">
                  <div><div className="row-t">{m.marca} — {m.tema}</div><div className="row-s">{m.fecha} · {m.modo}</div></div>
                  <button className="x sm" onClick={() => set("capacitaciones", c.capacitaciones.filter((x) => x.id !== m.id))}>✕</button>
                </div>
              ))}
            </div>}
        </div>
      )}

      <div className="modal-foot merge-foot">
        <Btn onClick={() => setMerging(true)}>⇄ Fusionar con otro</Btn>
        <div className="foot-right">
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn kind="primary" onClick={guardar} disabled={!c.nombre}>Guardar cliente</Btn>
        </div>
      </div>
      {merging && <MergeModal base={c} db={db} onCancel={() => setMerging(false)} onMerged={() => { setMerging(false); onClose(); }} />}
    </Modal>
  );
}
function PhotoBox({ label, data, onPick }) {
  const ref = useRef();
  return (
    <div className="photobox">
      <div className="photobox-l">{label}</div>
      {data ? <img src={data} alt={label} onClick={() => ref.current.click()} />
        : <button className="photo-empty" onClick={() => ref.current.click()}>+ Subir foto</button>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}

/* ---------- Prospectos ---------- */
/* ---------- Seguimiento (línea de avance de leads) ---------- */
const ORIGENES_LEAD = ["Base de Datos", "Visita en Terreno", "Contacto desde Instagram", "Facebook", "Página Web", "WhatsApp"];
const ORIGEN_FASE_MAP = {
  "Base de Datos": "Lead",
  "Visita en Terreno": "MQL",
  "Contacto desde Instagram": "Lead",
  "Facebook": "Lead",
  "Página Web": "MQL",
  "WhatsApp": "Lead",
};
const FASES_LEAD = ["Lead", "MQL", "SQL", "Cliente"];
const FASE_INFO = {
  Lead: { sub: "Contacto sin calificar", texto: "Dejó un dato de contacto (formulario, redes sociales, un evento, o lo encontraste en terreno/Maps). Todavía no sabemos si tiene presupuesto, necesidad real o intención real de comprar — hay que calificarlo." },
  MQL: { sub: "Marketing Qualified Lead", texto: "Encaja con el perfil de cliente ideal (taller, tienda, concesionario del rubro) y ya interactuó con la marca: pidió una ficha técnica, una cotización, o visitó varias veces. Todavía no fue contactado formalmente por un vendedor." },
  SQL: { sub: "Sales Qualified Lead", texto: "Ya lo contactaste y confirmó que tiene una necesidad real y capacidad de compra (ej.: \"necesito comprar 200 litros mensuales para mi cadena de talleres\"). Es una oportunidad de venta activa — el siguiente paso es cerrar." },
  Cliente: { sub: "Oportunidad cerrada", texto: "Ya compró o cerró un acuerdo contigo. El lead completó su recorrido por el embudo." },
};
function faseDe(c) {
  if (c.estado === "Cliente") return "Cliente";
  return FASES_LEAD.includes(c.fase) && c.fase !== "Cliente" ? c.fase : "Lead";
}

function Seguimiento({ db, go }) {
  const { me, clientes, visitas, users } = db;
  const [q, setQ] = useState("");
  const [fFase, setFFase] = useState("");
  const [fVend, setFVend] = useState("");
  const [ficha, setFicha] = useState(null);
  const [infoEtapa, setInfoEtapa] = useState(null);
  const [merging, setMerging] = useState(null);
  const { setClientes } = db;
  const saveCli = (c) => { setClientes((prev) => prev.map((x) => x.id === c.id ? c : x)); setFicha(null); };
  const moverFase = (c, dir) => {
    if (c.estado === "Cliente") return;
    const idx = FASES_LEAD.indexOf(faseDe(c));
    const ni = Math.max(0, Math.min(2, idx + dir));
    setClientes((prev) => prev.map((x) => x.id === c.id ? { ...x, fase: FASES_LEAD[ni] } : x));
  };
  const [convirtiendo, setConvirtiendo] = useState(null);
  const convertir = (row) => setConvirtiendo(row);
  const asignarme = (c) => setClientes((prev) => prev.map((x) => x.id === c.id ? { ...x, vendedorId: me.id } : x));

  const mine = clientes.filter((c) => (me.role === "admin" || c.vendedorId === me.id) && c.estado !== "Inactivo");
  const listables = mine.filter((c) => c.estado !== "Cliente");
  const visitasDe = (id) => visitas.filter((v) => v.clienteId === id && v.estado !== "Programada").sort((a, b) => a.fecha.localeCompare(b.fecha));

  const rows = listables.map((c) => {
    const vs = visitasDe(c.id);
    const ciclo = (c.fechaCreacion && c.fechaConversion) ? daysBetween(c.fechaCreacion, c.fechaConversion) : null;
    const enPipeline = c.estado !== "Cliente" && c.fechaCreacion ? daysBetween(c.fechaCreacion, today()) : null;
    return { c, vs, cantidadVisitas: vs.length, primera: vs[0]?.fecha, ultima: vs[vs.length - 1]?.fecha, ciclo, enPipeline };
  });

  const filtered = rows
    .filter((r) => !fFase || faseDe(r.c) === fFase)
    .filter((r) => !fVend || r.c.vendedorId === fVend)
    .filter((r) => !q || (r.c.nombre + " " + (r.c.razonSocial || "") + " " + (r.c.nombreFantasia || "") + " " + r.c.comuna).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.c.fechaCreacion || "").localeCompare(a.c.fechaCreacion || ""));

  const total = mine.length;
  const nLead = mine.filter((c) => faseDe(c) === "Lead").length;
  const nMQL = mine.filter((c) => faseDe(c) === "MQL").length;
  const nSQL = mine.filter((c) => faseDe(c) === "SQL").length;
  const nCli = mine.filter((c) => c.estado === "Cliente").length;
  const tasaConv = total ? Math.round((nCli / total) * 100) : 0;
  const convertidos = mine.filter((c) => c.fechaCreacion && c.fechaConversion);
  const cicloProm = convertidos.length
    ? Math.round(convertidos.reduce((s, c) => s + daysBetween(c.fechaCreacion, c.fechaConversion), 0) / convertidos.length)
    : null;
  const vendedores = users.filter((u) => u.role === "vendedor");
  const addrOf = (c) => c.dirComercial || [c.comuna, c.region].filter(Boolean).join(", ");

  return (
    <div className="stack">
      <div className="kpis funnel-kpis">
        <Kpi n={total} l="Total en pipeline" />
        <Kpi n={nLead} l="Leads" />
        <Kpi n={nMQL} l="MQL" tone="amber" />
        <Kpi n={nSQL} l="SQL (oportunidad)" tone="amber" />
        <Kpi n={nCli} l="Clientes" tone="green" />
        <Kpi n={tasaConv + "%"} l="Tasa de conversión" />
      </div>
      <p className="muted small" style={{ marginTop: -8 }}>
        Las tarjetas de abajo solo muestran a quienes aún no son clientes (lo que necesitas trabajar); los {nCli} ya convertidos siguen contando en las estadísticas y los ves en Clientes.
      </p>

      <div className="toolbar">
        <input className="search" placeholder="Buscar nombre, razón social, comuna…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fFase} onChange={(e) => setFFase(e.target.value)}>
          <option value="">Toda etapa</option>
          {FASES_LEAD.filter((e) => e !== "Cliente").map((e) => <option key={e}>{e}</option>)}
        </select>
        {me.role === "admin" && (
          <select value={fVend} onChange={(e) => setFVend(e.target.value)}>
            <option value="">Todo vendedor</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        )}
        <div className="muted small">{filtered.length} registro(s)</div>
      </div>

      {filtered.length === 0
        ? <Empty icon="⟶" title="Sin prospectos ni leads pendientes" sub="Ajusta la búsqueda o los filtros, o todos tus contactos ya son clientes." />
        : (
          <div className="funnel-list">
            {filtered.map(({ c, vs, cantidadVisitas, primera, ultima, ciclo, enPipeline }) => {
              const faseActual = faseDe(c);
              const etapaIdx = FASES_LEAD.indexOf(faseActual);
              const vend = users.find((u) => u.id === c.vendedorId);
              return (
                <div key={c.id} className="funnel-card" onClick={() => setFicha(c)}>
                  <div className="funnel-top">
                    <div className="funnel-name">
                      {c.nombre}
                      {c.razonSocial && c.razonSocial !== c.nombre && <span className="funnel-sub"> · {c.razonSocial}</span>}
                    </div>
                    <Badge tone={faseActual === "Cliente" ? "green" : faseActual === "SQL" ? "amber" : faseActual === "MQL" ? "blue" : "blue"}>{faseActual}</Badge>
                  </div>
                  <div className="funnel-meta">
                    {c.tipo}{c.comuna ? " · " + c.comuna : ""}{vend ? " · " + vend.nombre : ""}
                  </div>

                  <div className="stepper">
                    {FASES_LEAD.map((et, i) => (
                      <React.Fragment key={et}>
                        <div className={"step" + (i <= etapaIdx ? " done" : "") + (i === etapaIdx ? " current" : "")}>
                          <span className="step-dot">{i < etapaIdx ? "✓" : i + 1}</span>
                          <span className="step-label">
                            {et}
                            <button className="step-info" onClick={(e) => { e.stopPropagation(); setInfoEtapa(et); }} title={"Qué significa " + et}>ⓘ</button>
                          </span>
                          <span className="step-date">
                            {et === "Lead" ? (c.fechaCreacion || "—") : et === "Cliente" ? (c.fechaConversion || (i <= etapaIdx ? "—" : "")) : (cantidadVisitas > 0 ? cantidadVisitas + " visita(s)" : "—")}
                          </span>
                        </div>
                        {i < FASES_LEAD.length - 1 && <span className={"step-line" + (i < etapaIdx ? " done" : "")} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {c.estado !== "Cliente" && (
                    <div className="funnel-move" onClick={(e) => e.stopPropagation()}>
                      <button className="pipe-arrow" disabled={etapaIdx === 0} onClick={() => moverFase(c, -1)} title="Etapa anterior">‹</button>
                      <span className="muted small">Mover etapa de calificación</span>
                      <button className="pipe-arrow" disabled={etapaIdx === 2} onClick={() => moverFase(c, 1)} title="Etapa siguiente">›</button>
                    </div>
                  )}

                  <div className="funnel-stats" onClick={(e) => e.stopPropagation()}>
                    <span className="funnel-stat">📍 {cantidadVisitas} visita(s){ultima ? " · última " + ultima : ""}</span>
                    {ciclo != null && <span className="funnel-stat good">✓ Convertido en {ciclo} día(s)</span>}
                    {ciclo == null && enPipeline != null && <span className="funnel-stat">⏱ {enPipeline} día(s) en pipeline</span>}
                    <WaBtn tel={c.telefono} small />
                    {addrOf(c) && <a className="sel-go waze" href={wazeUrl(addrOf(c), coordOf(c))} target="_blank" rel="noreferrer" title="Waze">W</a>}
                    {addrOf(c) && <a className="sel-go maps" href={mapsDir(addrOf(c))} target="_blank" rel="noreferrer" title="Maps">M</a>}
                  </div>

                  <div className="funnel-ops" onClick={(e) => e.stopPropagation()}>
                    {!c.vendedorId && me.role !== "admin" && <Btn small onClick={() => asignarme(c)}>Tomar</Btn>}
                    <Btn small onClick={() => setMerging(c)}>⇄ Fusionar</Btn>
                    <Btn small kind="primary" onClick={() => convertir({ c, cantidadVisitas, ultima, enPipeline })}>Convertir a cliente</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {infoEtapa && (
        <Modal title={infoEtapa + " — " + FASE_INFO[infoEtapa].sub} onClose={() => setInfoEtapa(null)}>
          <p style={{ lineHeight: 1.6 }}>{FASE_INFO[infoEtapa].texto}</p>
        </Modal>
      )}
      {ficha && <ClienteForm cliente={ficha} onSave={saveCli} onClose={() => setFicha(null)} db={db} go={go} />}
      {merging && <MergeModal base={merging} db={db} onCancel={() => setMerging(null)} onMerged={() => setMerging(null)} />}
      {convirtiendo && (
        <ConvertirClienteModal row={convirtiendo} db={db}
          onCancel={() => setConvirtiendo(null)}
          onConfirmed={() => setConvirtiendo(null)} />
      )}
    </div>
  );
}

function ConvertirClienteModal({ row, db, onCancel, onConfirmed }) {
  const { c, cantidadVisitas, ultima, enPipeline } = row;
  const { setClientes } = db;
  const [origen, setOrigen] = useState(c.origen || "");

  const confirmar = () => {
    setClientes((prev) => prev.map((x) => x.id === c.id ? {
      ...x,
      estado: "Cliente",
      fechaConversion: x.fechaConversion || today(),
      origen: origen || x.origen,
    } : x));
    onConfirmed();
  };

  return (
    <Modal title={"Convertir a cliente: " + c.nombre} onClose={onCancel}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3 style={{ fontSize: 14 }}>Historial hasta hoy</h3></div>
        <div className="rows">
          <div className="row"><div className="row-t">Fecha de alta</div><b>{c.fechaCreacion || "Sin registro"}</b></div>
          <div className="row"><div className="row-t">Etapa de calificación alcanzada</div><Badge tone="amber">{faseDe(c)}</Badge></div>
          <div className="row"><div className="row-t">Visitas registradas</div><b>{cantidadVisitas}{ultima ? " (última: " + ultima + ")" : ""}</b></div>
          {enPipeline != null && <div className="row"><div className="row-t">Días en el pipeline</div><b>{enPipeline} día(s)</b></div>}
        </div>
      </div>

      <Field label="Origen del contacto" hint="Confirma o ajusta el origen antes de cerrar — queda guardado en su historial.">
        <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
          <option value="">Sin especificar</option>
          {ORIGENES_LEAD.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>

      <p className="muted small">Al confirmar, pasará a la lista de Clientes con fecha de conversión de hoy ({today()}).</p>
      <div className="modal-foot">
        <Btn onClick={onCancel}>Cancelar</Btn>
        <Btn kind="primary" onClick={confirmar}>Confirmar y convertir</Btn>
      </div>
    </Modal>
  );
}

/* ---------- Rutas ---------- */
function Rutas({ db, go }) {
  const { me, clientes, setVisitas, setClientes } = db;
  const mine = clientes.filter((c) => me.role === "admin" || c.vendedorId === me.id);
  const [fecha, setFecha] = useState(today());
  const [sel, setSel] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [cliQ, setCliQ] = useState("");
  const [myPos, setMyPos] = useState(null);
  const [ficha, setFicha] = useState(null);
  const saveCli = (c) => { setClientes((prev) => prev.map((x) => x.id === c.id ? c : x)); setFicha(null); };

  const stops = sel.map((id) => clientes.find((c) => c.id === id)).filter(Boolean);
  const routeStops = orderByProximity(stops, myPos);
  const sinCoord = routeStops.filter((c) => !coordOf(c)).length;
  const addrOf = (c) => c.dirComercial || [c.comuna, c.region].filter(Boolean).join(", ");
  const resultados = cliQ.trim()
    ? mine.filter((c) => !sel.includes(c.id) &&
        (c.nombre + " " + c.comuna + " " + c.region).toLowerCase().includes(cliQ.toLowerCase())).slice(0, 30)
    : [];
  const addCli = (id) => { setSel((s) => s.includes(id) ? s : [...s, id]); setCliQ(""); };
  const removeCli = (id) => setSel((s) => s.filter((x) => x !== id));

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) { alert("Tu dispositivo no entrega ubicación."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setMyPos([p.coords.latitude, p.coords.longitude]),
      () => alert("No se pudo obtener tu ubicación. Revisa los permisos del navegador."),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const confirmarVisitas = () => {
    if (routeStops.length === 0) return;
    const eventos = routeStops.map((c, i) => {
      const start = new Date(fecha + "T09:00:00");
      start.setMinutes(start.getMinutes() + i * 45);
      const end = new Date(start.getTime() + 45 * 60000);
      return { cli: c, start: start.toISOString(), end: end.toISOString() };
    });
    const nuevas = eventos.map((e) => ({
      id: uid(), clienteId: e.cli.id, vendedorId: me.id, fecha, estado: "Programada",
      motivo: "Visita planificada", resultado: "", observaciones: "", conclusiones: "",
      fotos: [], programada: e.start,
    }));
    setVisitas((prev) => [...prev, ...nuevas]);
    downloadICSMulti(eventos.map((e) => ({
      title: "Visita: " + e.cli.nombre, start: e.start, end: e.end,
      desc: "Visita planificada — CRM ICLA", loc: addrOf(e.cli),
    })));
    setSel([]); setMyPos(null); setCliQ("");
    if (go) go("visitas");
  };

  const nearMe = () => {
    const fallback = "https://www.google.com/maps/search/tiendas+de+motos+cerca+de+mi";
    const w = window.open("about:blank", "_blank"); // abrir ya, dentro del gesto del clic
    const go = (url) => { if (w && !w.closed) w.location.href = url; else window.open(url, "_blank"); };
    if (!navigator.geolocation) { go(fallback); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => go("https://www.google.com/maps/search/tiendas+de+motos/@" + p.coords.latitude + "," + p.coords.longitude + ",14z"),
      () => go(fallback),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <h3>Planificador de ruta</h3>
        </div>
        <div className="search-row">
          <Field label="Fecha base"><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        </div>

        <div className="cli-search">
          <input className="search" placeholder="Buscar cliente por nombre o comuna…"
            value={cliQ} onChange={(e) => setCliQ(e.target.value)} />
          {cliQ.trim() && (
            <div className="cli-results">
              {resultados.length === 0
                ? <div className="cli-none">Sin resultados para “{cliQ}”.</div>
                : resultados.map((c) => (
                  <button key={c.id} className="cli-res" onClick={() => addCli(c.id)}>
                    <span className="cli-res-n">{c.nombre}</span>
                    <span className="cli-res-s">{c.comuna || "—"} · Cat. {c.categoria}</span>
                    <span className="cli-res-add">+ Agregar</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="sel-head">
          <span>Visitas seleccionadas <span className="muted">({routeStops.length}){routeStops.length > 1 ? " · ordenadas por cercanía" : ""}</span></span>
          {stops.length > 0 &&
            <button className="link-btn" onClick={usarMiUbicacion}>
              {myPos ? "📍 Inicio: mi ubicación ✓" : "📍 Iniciar desde mi ubicación"}
            </button>}
        </div>
        {sinCoord > 0 && stops.length > 0 &&
          <div className="muted small" style={{ marginBottom: 8 }}>{sinCoord} cliente(s) sin comuna reconocida quedan al final del orden.</div>}
        {stops.length === 0
          ? <Empty icon="◍" title="Aún no hay clientes en la ruta" sub="Búscalos arriba y agrégalos a la visita." />
          : (
            <div className="sel-list">
              {routeStops.map((c, i) => (
                <div key={c.id} className="sel-row">
                  <span className="sel-num">{i + 1}</span>
                  <div className="sel-info">
                    <div className="sel-n">{c.nombre}</div>
                    <div className="sel-s">{addrOf(c) || "Sin dirección"}</div>
                  </div>
                  <Btn small onClick={() => setFicha(c)}>Ficha</Btn>
                  {(addrOf(c) || coordOf(c))
                    ? <>
                        <WaBtn tel={c?.telefono} small />
                        <a className="sel-go waze" href={wazeUrl(addrOf(c), coordOf(c))} target="_blank" rel="noreferrer" title="Navegar con Waze">W</a>
                        <a className="sel-go maps" href={mapsDir(addrOf(c) || c.comuna)} target="_blank" rel="noreferrer" title="Navegar con Maps">M</a>
                      </>
                    : <span className="sel-nogo" title="Sin dirección registrada">⌖</span>}
                  <button className="x sm" onClick={() => removeCli(c.id)} title="Quitar">✕</button>
                </div>
              ))}
            </div>
          )}

        {stops.length > 0 && (
          <>
            <div className="route-map-wrap">
              <iframe className="route-map" title="Mapa de la ruta"
                src={mapsEmbed(routeStops.map((s) => addrOf(s)))}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <div className="route-actions">
              <Btn kind="primary" onClick={confirmarVisitas}>✅ Confirmar visitas y agendar</Btn>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-head"><h3>Buscar tiendas de moto</h3></div>
        <div className="search-row">
          <Btn kind="maps" onClick={nearMe}>📍 Buscar tiendas cerca mío</Btn>
          <input className="search" placeholder="Ciudad o comuna…" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
          <Btn kind="maps" as="a" href={mapsSearchCity("tiendas de motos", searchCity)} >Buscar por ciudad/comuna</Btn>
        </div>
        <div className="search-row">
          <Btn kind="maps" as="a" href={mapsSearchCity("tiendas de motos", searchCity || "Chile")}>Buscar clientes con Maps (ciudad / región / Chile)</Btn>
          <span className="muted small">Los resultados de Maps se abren en una pestaña; agrégalos como clientes para sumarlos al planificador.</span>
        </div>
      </div>
      {ficha && <ClienteForm cliente={ficha} onSave={saveCli} onClose={() => setFicha(null)} db={db} go={go} />}
    </div>
  );
}

/* ---------- Visitas ---------- */
function fmtDay(s) {
  const [y, m, d] = (s || "").split("-").map(Number);
  if (!y) return { d: "?", mes: "", wd: "Sin fecha", rel: "" };
  const dt = new Date(y, m - 1, d);
  const wds = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const ms = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const diff = Math.round((dt - t0) / 86400000);
  let rel = "";
  if (diff === 0) rel = "Hoy"; else if (diff === 1) rel = "Mañana"; else if (diff === -1) rel = "Ayer"; else if (diff < 0) rel = "Atrasada";
  return { d, mes: ms[m - 1], wd: wds[dt.getDay()], rel };
}

function Visitas({ db, go }) {
  const { me, clientes, visitas, setVisitas, setClientes } = db;
  const mine = clientes.filter((c) => me.role === "admin" || c.vendedorId === me.id);
  const visM = visitas.filter((v) => me.role === "admin" || v.vendedorId === me.id);
  const programadas = visM.filter((v) => v.estado === "Programada").sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const realizadas = visM.filter((v) => v.estado !== "Programada").sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const [visForm, setVisForm] = useState(null);
  const [ficha, setFicha] = useState(null);
  const cliById = (id) => clientes.find((c) => c.id === id);
  const nombre = (id) => cliById(id)?.nombre || "—";
  const addrOf = (c) => c ? (c.dirComercial || [c.comuna, c.region].filter(Boolean).join(", ")) : "";

  const saveVisit = (v) => {
    setVisitas((p) => p.some((x) => x.id === v.id) ? p.map((x) => x.id === v.id ? v : x) : [...p, v]);
    setVisForm(null);
  };
  const saveCli = (c) => { setClientes((p) => p.map((x) => x.id === c.id ? c : x)); setFicha(null); };
  const delVisit = (id) => { if (confirm("¿Eliminar esta visita?")) setVisitas((p) => p.filter((x) => x.id !== id)); };

  const nuevaAdHoc = () => setVisForm({
    id: uid(), clienteId: "", vendedorId: me.id, fecha: today(), estado: "Visitada",
    motivo: MOTIVOS_VISITA[0], resultado: "Positivo", observaciones: "", conclusiones: "", fotos: [],
  });
  const marcarVisitada = (v) => setVisForm({ ...v, estado: "Visitada", fecha: today(), resultado: v.resultado || "Positivo", fotos: v.fotos || [] });

  const porDia = {};
  programadas.forEach((v) => { (porDia[v.fecha] = porDia[v.fecha] || []).push(v); });
  const dias = Object.keys(porDia).sort();
  const empezarViaje = (vs) => {
    const cls = orderByProximity(vs.map((x) => cliById(x.clienteId)).filter(Boolean), null);
    const stops = cls.map((c) => addrOf(c)).filter(Boolean);
    if (!stops.length) { alert("Estas visitas no tienen dirección registrada para armar la ruta."); return; }
    window.open(mapsMulti(stops), "_blank");
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="muted small">{programadas.length} programada(s) · {realizadas.length} realizada(s)</div>
        <Btn kind="primary" onClick={nuevaAdHoc}>+ Registrar visita</Btn>
      </div>

      <div className="card">
        <div className="card-head"><h3>Agenda de visitas</h3><span className="muted small">{dias.length} día(s) · {programadas.length} parada(s)</span></div>
        {programadas.length === 0
          ? <Empty icon="▤" title="No hay visitas programadas" sub="Confírmalas desde Plan Visitas." />
          : (
            <div className="cal">
              {dias.map((dia) => {
                const vs = porDia[dia];
                const f = fmtDay(dia);
                const relTone = f.rel === "Hoy" ? "green" : f.rel === "Atrasada" ? "red" : "amber";
                return (
                  <div key={dia} className="cal-group">
                    <div className="cal-head">
                      <div className="cal-date"><span className="d">{f.d}</span><span className="m">{f.mes}</span></div>
                      <div className="cal-title">
                        <div className="wd">{f.wd} {f.rel && <Badge tone={relTone}>{f.rel}</Badge>}</div>
                        <div className="ct">{vs.length} visita(s)</div>
                      </div>
                      <Btn small kind="primary" onClick={() => empezarViaje(vs)}>▶ Empezar viaje</Btn>
                    </div>
                    <div className="cal-visits">
                      {vs.map((x, i) => {
                        const c = cliById(x.clienteId);
                        return (
                          <div key={x.id} className="cal-visit">
                            <span className="cal-num">{i + 1}</span>
                            <div className="cal-v-info">
                              <div className="row-t">{nombre(x.clienteId)}</div>
                              <div className="row-s">{c?.comuna || "—"}{addrOf(c) ? " · " + addrOf(c) : ""}</div>
                            </div>
                            <div className="cal-v-actions">
                              <WaBtn tel={c?.telefono} small />
                              {addrOf(c) && <a className="sel-go waze" href={wazeUrl(addrOf(c), coordOf(c))} target="_blank" rel="noreferrer" title="Navegar con Waze">W</a>}
                              {addrOf(c) && <a className="sel-go maps" href={mapsDir(addrOf(c))} target="_blank" rel="noreferrer" title="Navegar con Maps">M</a>}
                              <Btn small onClick={() => setFicha(c)}>Ficha</Btn>
                              <Btn small kind="primary" onClick={() => marcarVisitada(x)}>Registrar</Btn>
                              <button className="x sm" onClick={() => delVisit(x.id)} title="Eliminar">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="card">
        <div className="card-head"><h3>Visitas realizadas</h3></div>
        {realizadas.length === 0
          ? <Empty icon="✓" title="Aún no hay visitas realizadas" />
          : (
            <div className="rows">
              {realizadas.map((x) => {
                const c = cliById(x.clienteId);
                return (
                  <div key={x.id} className="vis-done">
                    <div className="vis-done-top">
                      <div>
                        <div className="row-t">{nombre(x.clienteId)} <Badge tone={x.resultado === "Positivo" ? "green" : x.resultado === "Negativo" ? "red" : "amber"}>{x.resultado || "—"}</Badge></div>
                        <div className="row-s">{x.fecha} · {x.motivo}{x.observaciones ? " — " + x.observaciones : ""}</div>
                      </div>
                      <div className="row-actions">
                        <Btn small onClick={() => setFicha(c)}>Ficha de Cliente</Btn>
                        <Btn small onClick={() => setVisForm(x)}>Editar</Btn>
                        <button className="x sm" onClick={() => delVisit(x.id)} title="Eliminar">✕</button>
                      </div>
                    </div>
                    {x.fotos && x.fotos.length > 0 &&
                      <div className="vis-thumbs">{x.fotos.map((f, i) => <img key={i} src={f} alt={"foto " + (i + 1)} />)}</div>}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {visForm && <VisitaForm v0={visForm} mine={mine} onSave={saveVisit} onClose={() => setVisForm(null)} />}
      {ficha && <ClienteForm cliente={ficha} onSave={saveCli} onClose={() => setFicha(null)} db={db} go={go} />}
    </div>
  );
}

function VisitaForm({ v0, mine, onSave, onClose }) {
  const [v, setV] = useState(v0);
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));
  const locked = !!v0.clienteId && v0.estado === "Visitada" && v0.programada;
  const addFotos = async (e) => {
    const files = [...(e.target.files || [])];
    const imgs = await Promise.all(files.map((f) => resizeImage(f)));
    set("fotos", [...(v.fotos || []), ...imgs]);
  };
  const removeFoto = (i) => set("fotos", (v.fotos || []).filter((_, j) => j !== i));
  const guardar = () => { if (!v.clienteId) return; onSave({ ...v, estado: "Visitada", visitadaEn: today() }); };

  return (
    <Modal title={v0.estado === "Programada" || v0.programada ? "Registrar resultado de visita" : "Visita"} onClose={onClose}>
      <div className="grid2">
        <div className="full">
          <Field label="Cliente">
            {locked
              ? <input value={mine.find((c) => c.id === v.clienteId)?.nombre || ""} disabled />
              : <select value={v.clienteId} onChange={(e) => set("clienteId", e.target.value)}>
                  <option value="">— Selecciona —</option>
                  {mine.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>}
          </Field>
        </div>
        <Field label="Motivo"><select value={v.motivo} onChange={(e) => set("motivo", e.target.value)}>{MOTIVOS_VISITA.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Fecha"><input type="date" value={v.fecha} onChange={(e) => set("fecha", e.target.value)} /></Field>
        <Field label="Resultado"><select value={v.resultado} onChange={(e) => set("resultado", e.target.value)}>{["Positivo", "Neutro", "Negativo"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        <div className="full"><Field label="Observaciones"><textarea rows={3} value={v.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Qué se conversó, acuerdos, próximos pasos…" /></Field></div>
        <div className="full">
          <Field label="Fotos de la visita">
            <div className="vis-photo-grid">
              {(v.fotos || []).map((f, i) => (
                <div key={i} className="vis-photo"><img src={f} alt={"foto " + (i + 1)} /><button className="vis-photo-x" onClick={() => removeFoto(i)}>✕</button></div>
              ))}
              <label className="vis-photo-add">+ Foto<input type="file" accept="image/*" multiple hidden onChange={addFotos} /></label>
            </div>
          </Field>
        </div>
      </div>
      <div className="modal-foot">
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn kind="primary" onClick={guardar} disabled={!v.clienteId}>Guardar como visitada</Btn>
      </div>
    </Modal>
  );
}

/* ---------- Viajes y fondos ---------- */
function emptyViaje(me) {
  return {
    id: uid(), vendedorId: me.id, motivo: "Visita planificada", tipo: "", ciudades: "",
    inicio: today(), termino: today(), transporte: "Auto", zona: "",
    gastos: { pasajes: "", auto: "", hotel: "", alimentacion: "", peajes: "", estacionamiento: "", otros: "" },
    estado: "Borrador",
  };
}
function Viajes({ db }) {
  const { me, viajes, setViajes, users } = db;
  const mine = viajes.filter((v) => me.role === "admin" || v.vendedorId === me.id);
  const [v, setV] = useState(null);
  const total = (g) => Object.values(g).reduce((s, x) => s + Number(x || 0), 0);
  const nombreVend = (id) => users.find((u) => u.id === id)?.nombre || "—";

  const save = () => {
    setViajes((p) => p.some((x) => x.id === v.id) ? p.map((x) => x.id === v.id ? v : x) : [...p, v]);
    setV(null);
  };
  const enviarMail = (vi) => {
    const body =
      "Solicitud de fondos para viaje%0D%0A" +
      "Motivo: " + vi.motivo + (vi.tipo ? " / " + vi.tipo : "") + "%0D%0A" +
      "Ciudades: " + vi.ciudades + "%0D%0A" +
      "Fechas: " + vi.inicio + " a " + vi.termino + "%0D%0A" +
      "Transporte: " + vi.transporte + "%0D%0A%0D%0A" +
      "Pasajes: " + fmtCLP(vi.gastos.pasajes) + "%0D%0A" +
      "Arriendo auto: " + fmtCLP(vi.gastos.auto) + "%0D%0A" +
      "Hotel: " + fmtCLP(vi.gastos.hotel) + "%0D%0A" +
      "Alimentación: " + fmtCLP(vi.gastos.alimentacion) + "%0D%0A" +
      "Peajes: " + fmtCLP(vi.gastos.peajes) + "%0D%0A" +
      "Estacionamientos: " + fmtCLP(vi.gastos.estacionamiento) + "%0D%0A" +
      "Otros: " + fmtCLP(vi.gastos.otros) + "%0D%0A%0D%0A" +
      "TOTAL: " + fmtCLP(total(vi.gastos));
    window.location.href = "mailto:?subject=" + encodeURIComponent("Solicitud de fondos — " + vi.ciudades) + "&body=" + body;
  };

  return (
    <div className="stack">
      <div className="toolbar"><div /><Btn kind="primary" onClick={() => setV(emptyViaje(me))}>+ Planificar viaje</Btn></div>
      {mine.length === 0 ? <Empty icon="✈" title="Sin viajes planificados" sub="Planifica viajes, eventos, competencias o ferias y solicita fondos por correo." /> :
        <div className="rows">
          {mine.map((x) => (
            <div key={x.id} className="row">
              <div>
                <div className="row-t">{x.ciudades || "Viaje sin destino"} <Badge tone={x.estado === "Enviado" ? "green" : "n"}>{x.estado}</Badge></div>
                <div className="row-s">{x.motivo}{x.tipo ? " · " + x.tipo : ""} · {x.inicio} → {x.termino} · {fmtCLP(total(x.gastos))} {me.role === "admin" ? "· " + nombreVend(x.vendedorId) : ""}</div>
              </div>
              <div className="row-actions"><Btn small onClick={() => setV(x)}>Editar</Btn></div>
            </div>
          ))}
        </div>}
      {v && (
        <Modal wide title="Planificar viaje y solicitar fondos" onClose={() => setV(null)}>
          <div className="grid2">
            <Field label="Motivo"><select value={v.motivo} onChange={(e) => setV({ ...v, motivo: e.target.value })}>{MOTIVOS_VISITA.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Tipo de viaje"><select value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value })}><option value="">— (opcional) —</option>{TIPOS_VIAJE.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <div className="full"><Field label="Ciudades"><input value={v.ciudades} onChange={(e) => setV({ ...v, ciudades: e.target.value })} /></Field></div>
            <Field label="Fecha inicio"><input type="date" value={v.inicio} onChange={(e) => setV({ ...v, inicio: e.target.value })} /></Field>
            <Field label="Fecha término"><input type="date" value={v.termino} onChange={(e) => setV({ ...v, termino: e.target.value })} /></Field>
            <Field label="Medio de transporte"><select value={v.transporte} onChange={(e) => setV({ ...v, transporte: e.target.value })}>{["Auto", "Avión", "Bus", "Otro"].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Zona / región"><input value={v.zona} onChange={(e) => setV({ ...v, zona: e.target.value })} /></Field>
          </div>
          <h4 className="sub-h">Gastos estimados</h4>
          <div className="grid2">
            {[["pasajes", "Pasajes"], ["auto", "Arriendo auto"], ["hotel", "Hotel"], ["alimentacion", "Alimentación"], ["peajes", "Peajes"], ["estacionamiento", "Estacionamientos"], ["otros", "Otros gastos"]].map(([k, l]) =>
              <Field key={k} label={l}><input type="number" value={v.gastos[k]} onChange={(e) => setV({ ...v, gastos: { ...v.gastos, [k]: e.target.value } })} /></Field>)}
            <div className="full total">Total solicitado: <b>{fmtCLP(total(v.gastos))}</b></div>
          </div>
          <div className="modal-foot">
            <Btn onClick={() => setV(null)}>Cancelar</Btn>
            <Btn onClick={save}>Guardar borrador</Btn>
            <Btn kind="primary" onClick={() => { setV({ ...v, estado: "Enviado" }); enviarMail(v); }}>Enviar solicitud por correo</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Agenda ---------- */
function Agenda({ db }) {
  const { me, reuniones, setReuniones, clientes } = db;
  const mine = reuniones.filter((r) => me.role === "admin" || r.vendedorId === me.id).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const [open, setOpen] = useState(false);
  const [r, setR] = useState({ titulo: "", clienteId: "", inicio: "", termino: "", lugar: "", notas: "" });
  const save = () => {
    if (!r.titulo || !r.inicio) return;
    setReuniones((p) => [...p, { ...r, id: uid(), vendedorId: me.id }]);
    setOpen(false); setR({ titulo: "", clienteId: "", inicio: "", termino: "", lugar: "", notas: "" });
  };
  return (
    <div className="stack">
      <div className="toolbar"><div /><Btn kind="primary" onClick={() => setOpen(true)}>+ Nueva reunión</Btn></div>
      {mine.length === 0 ? <Empty icon="▤" title="Agenda vacía" sub="Crea reuniones y expórtalas a Google Calendar u Outlook." /> :
        <div className="rows">
          {mine.map((x) => (
            <div key={x.id} className="row">
              <div><div className="row-t">{x.titulo}</div><div className="row-s">{x.inicio?.replace("T", " ")} · {x.lugar}</div></div>
              <div className="row-actions">
                <Btn small as="a" href={gcalUrl(x.titulo, x.inicio, x.termino || x.inicio, x.notas, x.lugar)}>Google</Btn>
                <Btn small as="a" href={outlookUrl(x.titulo, x.inicio, x.termino || x.inicio, x.notas, x.lugar)}>Outlook</Btn>
                <Btn small onClick={() => downloadICS(x.titulo, x.inicio, x.termino || x.inicio, x.notas, x.lugar)}>.ics</Btn>
              </div>
            </div>
          ))}
        </div>}
      {open && (
        <Modal title="Nueva reunión" onClose={() => setOpen(false)}>
          <div className="grid2">
            <div className="full"><Field label="Título"><input value={r.titulo} onChange={(e) => setR({ ...r, titulo: e.target.value })} /></Field></div>
            <div className="full"><Field label="Cliente (opcional)"><select value={r.clienteId} onChange={(e) => setR({ ...r, clienteId: e.target.value })}><option value="">—</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field></div>
            <Field label="Inicio"><input type="datetime-local" value={r.inicio} onChange={(e) => setR({ ...r, inicio: e.target.value })} /></Field>
            <Field label="Término"><input type="datetime-local" value={r.termino} onChange={(e) => setR({ ...r, termino: e.target.value })} /></Field>
            <div className="full"><Field label="Lugar"><input value={r.lugar} onChange={(e) => setR({ ...r, lugar: e.target.value })} /></Field></div>
            <div className="full"><Field label="Notas"><textarea rows={2} value={r.notas} onChange={(e) => setR({ ...r, notas: e.target.value })} /></Field></div>
          </div>
          <div className="modal-foot"><Btn onClick={() => setOpen(false)}>Cancelar</Btn><Btn kind="primary" onClick={save} disabled={!r.titulo || !r.inicio}>Guardar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Precios y ofertas ---------- */
function Precios({ db }) {
  const { precios, setPrecios } = db;
  const TIPO = { precios: "Lista de precios", promos: "Promoción/Oferta", catalogos: "Catálogo" };
  const LABEL = { precios: "lista", promos: "oferta", catalogos: "catálogo" };
  const [tab, setTab] = useState("precios");
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState({ marca: MARCAS[0].n, titulo: "", tipo: TIPO.precios, archivo: "", nombreArchivo: "" });
  const pickFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setItem((p) => ({ ...p, archivo: r.result, nombreArchivo: f.name })); r.readAsDataURL(f); };
  const abrir = () => { setItem({ marca: MARCAS[0].n, titulo: "", tipo: TIPO[tab], archivo: "", nombreArchivo: "" }); setOpen(true); };
  const save = () => { if (!item.titulo) return; setPrecios((p) => [...p, { ...item, id: uid(), fecha: today() }]); setOpen(false); };
  const lista = precios.filter((p) => p.tipo === TIPO[tab]);

  return (
    <div className="stack">
      <div className="tabs">
        <button className={"tab" + (tab === "precios" ? " on" : "")} onClick={() => setTab("precios")}>Listas de precios</button>
        <button className={"tab" + (tab === "promos" ? " on" : "")} onClick={() => setTab("promos")}>Promociones y ofertas</button>
        <button className={"tab" + (tab === "catalogos" ? " on" : "")} onClick={() => setTab("catalogos")}>Catálogos</button>
      </div>
      <div className="toolbar"><div /><Btn kind="primary" onClick={abrir}>+ Subir {LABEL[tab]}</Btn></div>
      {lista.length === 0 ? <Empty icon="₵" title={"Sin " + LABEL[tab] + "s"} sub="Súbelas por marca y envíalas a tus clientes por correo o WhatsApp." /> :
        <div className="rows">
          {lista.map((p) => (
            <div key={p.id} className="row">
              <div><div className="row-t">{p.titulo} <Badge>{p.marca}</Badge></div><div className="row-s">{p.fecha} · {p.nombreArchivo || "sin archivo"}</div></div>
              <div className="row-actions">
                {p.archivo && <Btn small as="a" href={p.archivo} download={p.nombreArchivo}>Ver</Btn>}
                <Btn small kind="waze" as="a" href={waText(p.titulo + " (" + p.marca + ") — adjunto la información.")}>WhatsApp</Btn>
                <Btn small as="a" href={"mailto:?subject=" + encodeURIComponent(p.titulo + " - " + p.marca) + "&body=" + encodeURIComponent("Le comparto " + p.titulo + " de " + p.marca + ".")}>Correo</Btn>
              </div>
            </div>
          ))}
        </div>}
      {open && (
        <Modal title={"Subir " + LABEL[tab]} onClose={() => setOpen(false)}>
          <div className="grid2">
            <Field label="Marca"><select value={item.marca} onChange={(e) => setItem({ ...item, marca: e.target.value })}>{MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}</select></Field>
            <Field label="Título"><input value={item.titulo} onChange={(e) => setItem({ ...item, titulo: e.target.value })} /></Field>
            <div className="full"><Field label="Archivo (PDF/imagen)" hint="Se guarda dentro de la app (máx. ~5MB)."><input type="file" onChange={pickFile} /></Field></div>
          </div>
          <div className="modal-foot"><Btn onClick={() => setOpen(false)}>Cancelar</Btn><Btn kind="primary" onClick={save} disabled={!item.titulo}>Guardar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Marketing ---------- */
function MarketingMod({ db }) {
  const { me, marketing, setMarketing, solCap, setSolCap } = db;
  const [tab, setTab] = useState("rrss");
  const [open, setOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);
  const readonly = me.role === "cliente";
  const [item, setItem] = useState({ cat: "rrss", marca: MARCAS[0].n, titulo: "", formato: "Post", archivo: "", nombreArchivo: "", comentario: "" });
  const [sol, setSol] = useState({ marca: MARCAS[0].n, modo: MODOS_CAP[0], fecha: today(), tema: "" });

  const pickFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setItem((p) => ({ ...p, archivo: r.result, nombreArchivo: f.name })); r.readAsDataURL(f); };
  const save = () => { if (!item.titulo) return; setMarketing((p) => [...p, { ...item, cat: tab, id: uid(), fecha: today() }]); setOpen(false); setItem({ cat: tab, marca: MARCAS[0].n, titulo: "", formato: "Post", archivo: "", nombreArchivo: "", comentario: "" }); };
  const saveSol = () => { if (!sol.tema) return; setSolCap((p) => [...p, { ...sol, id: uid(), vendedor: me.nombre }]); setSolOpen(false); setSol({ marca: MARCAS[0].n, modo: MODOS_CAP[0], fecha: today(), tema: "" }); };
  const lista = marketing.filter((m) => m.cat === tab);

  const TABS = [["rrss", "RRSS"], ["eventos", "Eventos y competencias"], ["cap", "Capacitaciones"]];
  return (
    <div className="stack">
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>

      <div className="toolbar">
        <div className="muted small">
          {tab === "rrss" && "Material para carrusel, reels y publicaciones de Instagram, Facebook y WhatsApp."}
          {tab === "eventos" && "Fotos, videos y comentarios de eventos y competencias."}
          {tab === "cap" && "Fichas técnicas, fichas de seguridad, manuales y catálogos por marca."}
        </div>
        <div className="row-actions">
          {tab === "cap" && <Btn onClick={() => setSolOpen(true)}>Solicitar capacitación</Btn>}
          {!readonly && <Btn kind="primary" onClick={() => { setItem({ cat: tab, marca: MARCAS[0].n, titulo: "", formato: tab === "rrss" ? "Post" : "Catálogo", archivo: "", nombreArchivo: "", comentario: "" }); setOpen(true); }}>+ Subir material</Btn>}
        </div>
      </div>

      {lista.length === 0 ? <Empty icon="◈" title="Sin material" sub={readonly ? "Pronto tu ejecutivo cargará material aquí." : "Sube el primer material para esta sección."} /> :
        <div className="cards-grid">
          {lista.map((m) => (
            <div key={m.id} className="mkt-card">
              {m.archivo && /image/.test(m.archivo) ? <img src={m.archivo} alt={m.titulo} /> : <div className="mkt-file">📄 {m.nombreArchivo || "Archivo"}</div>}
              <div className="mkt-body">
                <div className="row-t">{m.titulo} <Badge>{m.marca}</Badge></div>
                <div className="row-s">{m.formato} · {m.fecha}</div>
                {m.comentario && <div className="row-s">{m.comentario}</div>}
                <div className="row-actions">
                  <Btn small kind="waze" as="a" href={waText(m.titulo + " — " + m.marca)}>WhatsApp</Btn>
                  <Btn small as="a" href={"mailto:?subject=" + encodeURIComponent(m.titulo) + "&body=" + encodeURIComponent("Material de " + m.marca + ": " + m.titulo)}>Correo</Btn>
                  {m.archivo && <Btn small as="a" href={m.archivo} download={m.nombreArchivo}>Descargar</Btn>}
                </div>
              </div>
            </div>
          ))}
        </div>}

      {open && (
        <Modal title="Subir material" onClose={() => setOpen(false)}>
          <div className="grid2">
            <Field label="Marca"><select value={item.marca} onChange={(e) => setItem({ ...item, marca: e.target.value })}>{MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}</select></Field>
            <Field label="Formato">
              <select value={item.formato} onChange={(e) => setItem({ ...item, formato: e.target.value })}>
                {(tab === "rrss" ? ["Post", "Carrusel", "Reel", "Imagen general"] : tab === "eventos" ? ["Foto", "Video", "Comentario"] : ["Ficha técnica", "Ficha de seguridad", "Manual", "Catálogo"]).map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <div className="full"><Field label="Título"><input value={item.titulo} onChange={(e) => setItem({ ...item, titulo: e.target.value })} /></Field></div>
            <div className="full"><Field label="Archivo (imagen/video/PDF)"><input type="file" onChange={pickFile} /></Field></div>
            {tab === "eventos" && <div className="full"><Field label="Comentario"><textarea rows={2} value={item.comentario} onChange={(e) => setItem({ ...item, comentario: e.target.value })} /></Field></div>}
          </div>
          <div className="modal-foot"><Btn onClick={() => setOpen(false)}>Cancelar</Btn><Btn kind="primary" onClick={save} disabled={!item.titulo}>Guardar</Btn></div>
        </Modal>
      )}

      {solOpen && (
        <Modal title="Solicitar capacitación" onClose={() => setSolOpen(false)}>
          <div className="grid2">
            <Field label="Marca"><select value={sol.marca} onChange={(e) => setSol({ ...sol, marca: e.target.value })}>{MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}</select></Field>
            <Field label="Modalidad"><select value={sol.modo} onChange={(e) => setSol({ ...sol, modo: e.target.value })}>{MODOS_CAP.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Fecha deseada"><input type="date" value={sol.fecha} onChange={(e) => setSol({ ...sol, fecha: e.target.value })} /></Field>
            <Field label="Tema"><input value={sol.tema} onChange={(e) => setSol({ ...sol, tema: e.target.value })} /></Field>
          </div>
          <div className="modal-foot"><Btn onClick={() => setSolOpen(false)}>Cancelar</Btn><Btn kind="primary" onClick={saveSol} disabled={!sol.tema}>Enviar solicitud</Btn></div>
        </Modal>
      )}
      {tab === "cap" && solCap.length > 0 && !readonly && (
        <div className="card"><div className="card-head"><h3>Solicitudes de capacitación</h3></div>
          <div className="rows">{solCap.map((s) => <div key={s.id} className="row"><div><div className="row-t">{s.marca} — {s.tema}</div><div className="row-s">{s.modo} · {s.fecha} · {s.vendedor}</div></div></div>)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Reportes ---------- */
function RankList({ title, rows, top, icon, sub, suffix }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  const shown = top ? rows.slice(0, top) : rows;
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3><span className="muted small">{rows.length} total</span></div>
      {sub && <p className="muted small" style={{ marginTop: -6, marginBottom: 10 }}>{sub}</p>}
      {shown.length === 0 ? <Empty icon={icon || "▮"} title="Sin datos" /> : (
        <div className="rank-list">
          {shown.map(([label, count], i) => (
            <div key={label} className="rank-row">
              <span className="rank-pos">{i + 1}</span>
              <div className="rank-info">
                <div className="rank-label">{label}</div>
                <div className="rank-bar-track"><div className="rank-bar-fill" style={{ width: (count / max * 100) + "%" }} /></div>
              </div>
              <span className="rank-count">{count}{suffix || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Reportes({ db }) {
  const { me, clientes, visitas, viajes, users } = db;
  const isAdmin = me.role === "admin";
  const cl = isAdmin ? clientes : clientes.filter((c) => c.vendedorId === me.id);
  const vs = (isAdmin ? visitas : visitas.filter((v) => v.vendedorId === me.id)).filter((v) => v.estado !== "Programada");
  const vj = isAdmin ? viajes : viajes.filter((v) => v.vendedorId === me.id);

  const visDia = vs.filter((v) => v.fecha === today()).length;
  const visSem = vs.filter((v) => daysBetween(v.fecha, today()) >= 0 && daysBetween(v.fecha, today()) < 7).length;
  const visMes = vs.filter((v) => v.fecha?.slice(0, 7) === today().slice(0, 7)).length;

  // ===== Análisis de mercado (motos Chile) — filtros =====
  const [mkRegion, setMkRegion] = useState("");
  const [mkComuna, setMkComuna] = useState("");
  const [mkMarca, setMkMarca] = useState("");
  const [mkVend, setMkVend] = useState("");
  const vendedores = users.filter((u) => u.role === "vendedor");
  const comunasDisp = [...new Set(cl.filter((c) => !mkRegion || c.region === mkRegion).map((c) => c.comuna).filter(Boolean))].sort();

  const mk = cl
    .filter((c) => !mkRegion || c.region === mkRegion)
    .filter((c) => !mkComuna || c.comuna === mkComuna)
    .filter((c) => !mkMarca || (c.marcasPropias || []).includes(mkMarca))
    .filter((c) => !mkVend || c.vendedorId === mkVend);

  const mkClientes = mk.filter((c) => c.estado === "Cliente");
  const mkProspectos = mk.filter((c) => c.estado === "Prospecto");
  const mkLeads = mk.filter((c) => c.estado === "Lead");
  const regionesCubiertas = new Set(mk.map((c) => c.region).filter(Boolean)).size;
  const comunasCubiertas = new Set(mk.map((c) => c.comuna).filter(Boolean)).size;
  const tasaConvMk = mk.length ? Math.round((mkClientes.length / mk.length) * 100) : 0;
  const visitasMk = vs.filter((v) => mk.some((c) => c.id === v.clienteId));
  const promVisitasMk = mk.length ? (visitasMk.length / mk.length).toFixed(1) : "0";

  const conteo = (arr, fn) => { const o = {}; arr.forEach((c) => { const k = fn(c); if (Array.isArray(k)) k.forEach((x) => x && (o[x] = (o[x] || 0) + 1)); else if (k) o[k] = (o[k] || 0) + 1; }); return o; };
  const toRank = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);

  const rankComunas = toRank(conteo(mk, (c) => c.comuna));
  const rankRegiones = toRank(conteo(mk, (c) => c.region));
  const rankMarcas = toRank(conteo(mk, (c) => c.marcasPropias || []));
  const rankTipo = toRank(conteo(mk, (c) => c.tipo));
  const rankSegmento = toRank(conteo(mk, (c) => c.segmentos || []));
  const rankCategoria = toRank(conteo(mk, (c) => "Cat " + (c.categoria || "3") + " · " + (CAT_LABELS[c.categoria] || "")));
  const rankVend = toRank(conteo(mk, (c) => users.find((u) => u.id === c.vendedorId)?.nombre || "Sin asignar"));
  const marcaLider = rankMarcas[0];
  const comunaLider = rankComunas[0];

  // marketing por marca / por tienda
  const mktPorMarca = {};
  const mktPorTienda = [];
  cl.forEach((c) => {
    const tot = c.marketing.reduce((s, m) => s + Number(m.valor || 0), 0);
    if (tot) mktPorTienda.push({ nombre: c.nombre, total: tot });
    c.marketing.forEach((m) => { mktPorMarca[m.tipo] = (mktPorMarca[m.tipo] || 0) + Number(m.valor || 0); });
  });
  mktPorTienda.sort((a, b) => b.total - a.total);

  // gastos viajes por motivo / zona / vendedor
  const totV = (g) => Object.values(g).reduce((s, x) => s + Number(x || 0), 0);
  const gastoMotivo = {}, gastoZona = {}, gastoVend = {};
  vj.forEach((v) => {
    const t = totV(v.gastos);
    gastoMotivo[v.motivo] = (gastoMotivo[v.motivo] || 0) + t;
    if (v.zona) gastoZona[v.zona] = (gastoZona[v.zona] || 0) + t;
    const n = users.find((u) => u.id === v.vendedorId)?.nombre || "—";
    gastoVend[n] = (gastoVend[n] || 0) + t;
  });

  const Tbl = ({ title, rows, money }) => (
    <div className="card">
      <div className="card-head"><h3>{title}</h3></div>
      {rows.length === 0 ? <Empty icon="▮" title="Sin datos aún" /> :
        <div className="rows">{rows.map(([k, v]) => <div key={k} className="row"><div className="row-t">{k}</div><b>{money ? fmtCLP(v) : v}</b></div>)}</div>}
    </div>
  );

  return (
    <div className="stack">
      <div className="kpis">
        <Kpi n={visDia} l="Visitas hoy" />
        <Kpi n={visSem} l="Visitas semana" />
        <Kpi n={visMes} l="Visitas mes" />
        <Kpi n={cl.filter((c) => c.estado === "Lead").length} l="Leads" tone="amber" />
        <Kpi n={cl.filter((c) => c.estado === "Prospecto").length} l="Prospectos" tone="amber" />
        <Kpi n={cl.filter((c) => c.estado === "Cliente").length} l="Cierres" tone="green" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Análisis del mercado de motos en Chile</h3>
          <span className="muted small">Cartera {isAdmin ? "total" : "propia"}</span>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>Filtra por vendedor, región, comuna o marca para analizar un segmento del mercado.</p>
        <div className="toolbar" style={{ padding: 0, marginBottom: 14 }}>
          {isAdmin && (
            <select value={mkVend} onChange={(e) => setMkVend(e.target.value)}>
              <option value="">Todo vendedor</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          )}
          <select value={mkRegion} onChange={(e) => { setMkRegion(e.target.value); setMkComuna(""); }}>
            <option value="">Toda región</option>
            {Object.keys(REGIONES).map((r) => <option key={r}>{r}</option>)}
          </select>
          <select value={mkComuna} onChange={(e) => setMkComuna(e.target.value)}>
            <option value="">Toda comuna / ciudad</option>
            {comunasDisp.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={mkMarca} onChange={(e) => setMkMarca(e.target.value)}>
            <option value="">Toda marca</option>
            {MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}
          </select>
          {(mkRegion || mkComuna || mkMarca || mkVend) &&
            <Btn small onClick={() => { setMkRegion(""); setMkComuna(""); setMkMarca(""); setMkVend(""); }}>✕ Limpiar filtros</Btn>}
        </div>

        <div className="kpis">
          <Kpi n={mk.length} l="Puntos de venta (total)" />
          <Kpi n={mkClientes.length} l="Clientes activos" tone="green" />
          <Kpi n={mkProspectos.length} l="Prospectos" tone="amber" />
          <Kpi n={mkLeads.length} l="Leads" tone="amber" />
          <Kpi n={tasaConvMk + "%"} l="Tasa de conversión" />
          <Kpi n={promVisitasMk} l="Visitas / cliente" />
        </div>
        <div className="kpis" style={{ marginTop: 12 }}>
          <Kpi n={regionesCubiertas} l="Regiones con presencia" />
          <Kpi n={comunasCubiertas} l="Comunas con presencia" />
          <Kpi n={marcaLider ? marcaLider[0] : "—"} l="Marca líder en cartera" tone="amber" />
          <Kpi n={comunaLider ? comunaLider[0] : "—"} l="Comuna con más clientes" tone="amber" />
          <Kpi n={mk.length ? Math.round((mk.reduce((s, c) => s + (c.marcasPropias || []).length, 0) / mk.length) * 10) / 10 : 0} l="Marcas por cliente (prom.)" />
          <Kpi n={vj.length} l="Viajes registrados" />
        </div>
      </div>

      <div className="grid2col">
        <RankList title="Ranking de clientes por comuna / ciudad" rows={rankComunas} top={15} icon="◍"
          sub="Dónde está concentrada tu cartera — útil para priorizar zonas de cobertura." />
        <RankList title="Ranking por región" rows={rankRegiones} top={16} icon="▤" />
        <RankList title="Ranking por marca (clientes que la venden)" rows={rankMarcas} icon="₵" />
        <RankList title="Por tipo de cliente" rows={rankTipo} icon="◍" />
        <RankList title="Por segmento" rows={rankSegmento} icon="◎" />
        <RankList title="Por categoría de crédito" rows={rankCategoria} icon="₵" />
        {isAdmin && <RankList title="Cartera por vendedor" rows={rankVend} icon="⚙" />}
      </div>

      <Tbl title="Marketing por tipo de acción" rows={Object.entries(mktPorMarca)} money />
      <Tbl title="Marketing por tienda" rows={mktPorTienda.map((m) => [m.nombre, m.total])} money />
      <Tbl title="Gastos de viaje por motivo" rows={Object.entries(gastoMotivo)} money />
      <Tbl title="Gastos de viaje por zona" rows={Object.entries(gastoZona)} money />
      {isAdmin && <Tbl title="Gastos de viaje por vendedor" rows={Object.entries(gastoVend)} money />}
    </div>
  );
}

/* ---------- Información del Mercado ---------- */
const MKT_FECHA_ACT = "19 de junio de 2026";

const ANIM_TOTAL = [
  { anio: 2025, unidades: 28594, var: "+5,3%" },
  { anio: 2024, unidades: 27148, var: "−5,0%" },
];
const ANIM_IMPORT_2025 = { unidades: 40381, var: "+47,3%" };
const ANIM_SEGMENTOS_2025 = [["Multipropósito", 8234], ["Scooter / Under Bone", 3586], ["Deportivas", 2432]];
const ANIM_MARCAS_2024 = [["Honda", 20.7], ["Yamaha", 19.1], ["Bajaj", 7.4], ["Takasaki (Imoto)", 6.8],
  ["Haojue", 5.8], ["KTM", 5.6], ["Loncin (Imoto)", 5.1], ["Suzuki", 4.0], ["BMW", 3.3], ["Royal Enfield", 3.2]];
const ANIM_MODELOS_2024 = [["Honda Navi", 3.8], ["Honda CB125F Twister", 2.6], ["Haojue NK-150", 1.9],
  ["Yamaha YZF-R15", 1.9], ["Yamaha YBR-125Z", 1.8], ["Honda CRF300L", 1.7], ["Honda Dio", 1.7],
  ["Haojue KA-150", 1.7], ["Yamaha XTZ150", 1.6], ["Bajaj Pulsar 125", 1.5]];
const ANIM_MESES_2024_Q4 = [["Octubre", 2641], ["Noviembre", 2808], ["Diciembre", 3029]];
const ANIM_REGIONES_2024 = [["Metropolitana", 64], ["Valparaíso", 6.3], ["Coquimbo", 5.8]];
const ORIGEN_IMPORT_2025 = [["China", 59], ["India", 23], ["Japón y otros", 18]];

const MARKET_NEWS = [
  {
    titulo: "ANIM refuerza el llamado a la educación vial y a certificar escuelas de motociclistas",
    resumen: "En entrevistas con Chilevisión (sobre las carreras clandestinas) y BioBio TV (sobre escuelas certificadas), ANIM volvió a poner el foco en la formación de conductores como tarea pendiente del sector.",
    fuente: "ANIM (Chilevisión / BioBio TV)", fecha: "may 2026",
    url: "https://www.anim.cl/prensa",
  },
  {
    titulo: "ANIM: \"Chile enfrenta una deuda estructural en formación de motociclistas\"",
    resumen: "El gremio hizo un llamado directo a las autoridades por la falta de academias especializadas y de agilidad en los trámites para obtener la licencia clase C, factores que —advierte— afectan la seguridad vial del país.",
    fuente: "ANIM", fecha: "abr 2026",
    url: "https://www.anim.cl/_files/ugd/713935_05d8fb7128fc4000a64512d6813d112f.pdf",
  },
  {
    titulo: "Alza de combustibles: ANIM propone la motocicleta como solución de ahorro",
    resumen: "Frente al aumento del precio de los combustibles, el gremio posicionó a la moto como alternativa eficiente de movilidad y reiteró su llamado a impulsar la certificación de escuelas de conducción.",
    fuente: "ANIM", fecha: "mar 2026",
    url: "https://www.anim.cl/_files/ugd/713935_1e958249b95a4289956a8bfd76066639.pdf",
  },
  {
    titulo: "Balance ANIM 2025: la industria de la motocicleta crece 5,3% y retoma su trayectoria positiva",
    resumen: "Con 28.594 unidades vendidas, el mercado confirma su recuperación. Las importaciones subieron 47,3% (40.381 unidades), con predominio de origen chino, seguido de India y Japón. La Región Metropolitana concentró más de dos tercios de las ventas; ANIM no desagregó este balance por marca.",
    fuente: "ANIM / Revista S Motos", fecha: "ene–feb 2026",
    url: "https://www.anim.cl/_files/ugd/713935_b009c7cc6608430d9c104d5237331a18.pdf",
  },
  {
    titulo: "El mercado de las motos en Chile: dominio chino y un peso aún marginal en el parque vehicular",
    resumen: "Las motos representan solo el 3,9% del parque vehicular del país (una moto por cada once autos nuevos), una de las tasas más bajas de Latinoamérica. China ya concentra el 59% de las motos importadas y la India un 23%, desplazando en volumen a marcas japonesas y estadounidenses.",
    fuente: "Emol Economía", fecha: "6 feb 2026",
    url: "https://www.emol.com/noticias/Economia/2026/02/06/1190731/mercado-motos-chile-china.html",
  },
  {
    titulo: "Honda lideró 2024 con 20,7% de participación, última desagregación oficial por marca",
    resumen: "Según ANIM, Honda encabezó el mercado seguida por Yamaha (19,1%) y Bajaj (7,4%). En modelos, la Honda Navi fue la más vendida del año, seguida por la CB125F Twister y la Haojue NK-150. ANIM no ha vuelto a publicar este nivel de detalle por marca desde entonces.",
    fuente: "BioBioChile / S Motos", fecha: "12 feb 2025",
    url: "https://www.biobiochile.cl/noticias/economia/mercado-automotriz/2025/02/12/el-top-de-motocicletas-mas-vendidas-en-chile-durante-el-2024-dos-modelos-japoneses-lideran-el-ranking.shtml",
  },
];

const ANIM_2026_AVANCE = {
  texto: "Al cierre de esta actualización, ANIM no ha publicado cifras desagregadas del año en curso (2026). El gremio sí adelantó una proyección cualitativa para el año al cerrar el balance 2025.",
  cita: "“La motocicleta debe integrarse plenamente a los ecosistemas de movilidad urbana. Es un actor estratégico para enfrentar la congestión y reducir la contaminación en las ciudades.”",
  autor: "Cristián Reitze, presidente ejecutivo de ANIM — feb. 2026",
  pide: ["Infraestructura adecuada para motos", "Normativa moderna", "Convivencia vial eficiente"],
};

const SPORT_NEWS = [
  {
    titulo: "Chile MX llega a su 4ta fecha este fin de semana en Coelemu",
    resumen: "El Campeonato Gran Nacional de Motocross disputa su cuarta jornada el 20 y 21 de junio en el circuito MX Pataguas, tras la tercera fecha realizada el 23-24 de mayo en Cauquenes. La temporada continúa con séptima y octava fecha programadas para octubre y noviembre.",
    fuente: "Chile MX (oficial)", fecha: "20–21 jun 2026 · próxima fecha",
    url: "https://chilemx.cl/",
  },
  {
    titulo: "Desafío del Desierto suma su 25ª edición en Copiapó",
    resumen: "El histórico rally cross-country del norte de Chile cumple 25 años con una nueva versión entre el 25 y 28 de junio en Copiapó, Atacama, convocando a pilotos de rally raid de cara a la temporada que mira al Dakar.",
    fuente: "Anímate en Moto", fecha: "25–28 jun 2026 · próxima fecha",
    url: "https://www.animateenmoto.cl/detalles-y-registro/desafio-del-desierto-25va-edicion-1",
  },
  {
    titulo: "Zonal Centro Enduro disputó su 4ta fecha en Jahuel",
    resumen: "El tradicional campeonato de enduro de la zona central —uno de los más representativos del país— corrió su cuarta fecha el 13 y 14 de junio en el circuito de Jahuel, Valparaíso, organizado por el Jahuel Moto Club.",
    fuente: "Anímate en Moto / Zonal Centro", fecha: "13–14 jun 2026 · hace 6 días",
    url: "https://www.animateenmoto.cl/detalles-y-registro/zonal-centro-enduro-4ta-fecha",
  },
  {
    titulo: "Seven Cap Racing (Seven Cup) prepara su 4ta fecha para fin de junio",
    resumen: "El campeonato cross-country Seven Cap Racing —con ICLA e Ipone entre sus auspiciadores— tiene su próxima fecha el 28 de junio, correspondiente a la modalidad Le Mans de su calendario 2026.",
    fuente: "Anímate en Moto / 7CAP Racing", fecha: "28 jun 2026 · próxima fecha",
    url: "https://www.animateenmoto.cl/detalles-y-registro/seven-cap-racing-4ta-fecha",
  },
  {
    titulo: "Nacional FIM Enduro corrió su 3ra y 4ta fecha a fines de mayo",
    resumen: "El Campeonato Nacional Enduro FIM, organizado por la Federación de Motociclismo de Chile, disputó sus fechas 3 y 4 el 30 y 31 de mayo, manteniendo el nivel competitivo en las categorías Pro E1, Pro E2 y Pro Junior.",
    fuente: "Federación de Motociclismo de Chile", fecha: "30–31 may 2026 · hace 20 días",
    url: "https://www.animateenmoto.cl/detalles-y-registro/nacional-fim-enduro-3ra-y-4ta-fechas",
  },
  {
    titulo: "Copa del Rey Big Trail/UTV publicó el reglamento de su 2da fecha",
    resumen: "Tras la primera fecha en Picarquín (2 de mayo), la organización liberó este mes el reglamento de la segunda fecha 2026, a disputarse el 11 de julio en Fundo La Vinilla. ICLA e Ipone figuran entre los auspiciadores del evento.",
    fuente: "Copa del Rey (oficial)", fecha: "próxima fecha: 11 jul 2026",
    url: "https://copadelrey.cl/",
  },
  {
    titulo: "Trail Trophy: tras Ovalle, la preventa para Caldera ya está abierta",
    resumen: "La 2da fecha del campeonato de navegación con roadbook se corrió el 22 y 23 de mayo en Ovalle. La producción ya abrió la preventa para la 3ra fecha, el 17 y 18 de julio en Caldera, por las rutas del desierto de Atacama.",
    fuente: "Trail Trophy Chile (oficial)", fecha: "2da fecha: 22–23 may · 3ra fecha: 17–18 jul",
    url: "https://trailtrophy.cl/",
  },
];

const TENDENCIA_STATS = [
  { n: "3,9%", l: "Motos en el parque vehicular nacional" },
  { n: "1 x 11", l: "Motos vendidas por cada auto nuevo" },
  { n: "87%", l: "Motos vendidas de baja cilindrada (≤250cc)" },
  { n: "82%", l: "Motos importadas desde China + India" },
];

const MOTOGP_CALENDARIO = [
  { ronda: "Ronda 9", gp: "GP de la República Checa", lugar: "Automotodrom Brno", fecha: "19–21 jun 2026", estado: "Carrera hoy domingo" },
  { ronda: "Ronda 10", gp: "GP de Países Bajos", lugar: "Assen", fecha: "26–28 jun 2026", estado: "próxima" },
  { ronda: "Ronda 11", gp: "GP de Alemania", lugar: "Sachsenring", fecha: "10–12 jul 2026", estado: "cierra la 1ª mitad de temporada" },
];
const MOTOGP_RANKING = [
  ["Marco Bezzecchi (Aprilia)", 180], ["Jorge Martín (Aprilia)", 165], ["Fabio Di Giannantonio (Ducati)", 144],
  ["Pedro Acosta (KTM)", 132], ["Marc Márquez (Ducati)", 115],
];
const MOTOGP_NEWS = [
  {
    titulo: "Bagnaia gana la Sprint en Brno, su primera victoria al sprint de 2026",
    resumen: "El italiano de Ducati resistió los ataques de Ai Ogura y Marc Márquez para llevarse el sábado en el GP de la República Checa, su primer triunfo al sprint desde Malasia 2025.",
    fuente: "Motorsport.com", fecha: "20 jun 2026 · sprint",
    url: "https://es.motorsport.com/motogp/news/bagnaia-victoria-sprint-marquez-brno-chequia-resultados-clasificacion/10831849/",
  },
  {
    titulo: "Nueva caída de Bezzecchi: ya son 9 sábados complicados en 2026 y su ventaja baja a 15 puntos",
    resumen: "El líder del Mundial se fue al suelo a dos vueltas del final del sprint en Brno mientras peleaba por la quinta posición, reduciendo su renta sobre Jorge Martín a solo 15 puntos.",
    fuente: "Motorsport.com", fecha: "20 jun 2026",
    url: "https://es.motorsport.com/motogp/news/clasificacion-mundial-motogp2026-sprint-brno-chequia-puntos-posiciones/10831858/",
  },
  {
    titulo: "Ai Ogura logra la pole en Brno: Japón vuelve a liderar una parrilla casi seis años después",
    resumen: "El piloto de Trackhouse Aprilia firmó el mejor tiempo de la clasificación del GP de la República Checa, dejando a Di Giannantonio y Bagnaia en la primera fila.",
    fuente: "MotoGP.com", fecha: "20 jun 2026 · clasificación",
    url: "https://www.motogp.com/es/world-standing/2026/motogp/championship-standings",
  },
  {
    titulo: "Márquez sigue recortando: completó el podio del sprint y ya está a 65 puntos del liderato",
    resumen: "El ocho veces campeón del mundo terminó tercero en Brno y mantiene viva su remontada en la segunda mitad de la temporada, tras un doblete perfecto en Hungría.",
    fuente: "Crash.net", fecha: "20 jun 2026",
    url: "https://www.crash.net/motogp/results/1099040/1/brno-sprint-race-new-2026-motogp-world-championship-standings",
  },
];

const PILOT_SERIES = [
  { key: "chileMX", label: "Nacional Chile MX (Motocross)" },
  { key: "enduroFIM", label: "Nacional Enduro FIM Chile" },
  { key: "copaDelRey", label: "Copa del Rey (Big Trail/UTV)" },
  { key: "trailTrophy", label: "Trail Trophy" },
  { key: "zonalCentro", label: "Zonal Centro Enduro" },
];

function MktIcon({ glyph }) {
  return <span className="mkt-ico">{glyph}</span>;
}

function NewsList({ items }) {
  return (
    <div className="news-list">
      {items.map((n, i) => (
        <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-item">
          <div className="news-top">
            <div className="news-title">{n.titulo}</div>
            <span className="news-go">↗</span>
          </div>
          <p className="news-sum">{n.resumen}</p>
          <div className="news-meta">{n.fuente} · {n.fecha}</div>
        </a>
      ))}
    </div>
  );
}

function InfoMercado({ db }) {
  const { me, clientes } = db;
  const [ai, setAi, aiLoaded] = usePersistent("icla:mercado_ai_v1", null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const diasDesde = ai?.fetchedAt ? daysBetween(ai.fetchedAt.slice(0, 10), today()) : null;
  const stale = diasDesde != null && diasDesde >= 7;

  // ===== Cruce Mercado ↔ Cartera =====
  const normTxt = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const mine = clientes.filter((c) => me.role === "admin" || c.vendedorId === me.id);
  const misClientes = mine.filter((c) => c.estado === "Cliente");
  const conteoRegionCartera = {};
  misClientes.forEach((c) => { const r = (c.region || "Sin región").trim(); if (r) conteoRegionCartera[r] = (conteoRegionCartera[r] || 0) + 1; });
  const totalConRegion = Object.values(conteoRegionCartera).reduce((s, n) => s + n, 0) || 1;
  const ANIM_REGION_PCT = { metropolitana: 64, valparaiso: 6.3, coquimbo: 5.8 };
  const cruceRegiones = Object.entries(conteoRegionCartera).map(([region, n]) => {
    const pctCartera = Math.round((n / totalConRegion) * 1000) / 10;
    const key = normTxt(region);
    const pctMercado = ANIM_REGION_PCT[key];
    let lectura = "Sin dato de mercado para comparar";
    if (pctMercado != null) {
      const gap = pctCartera - pctMercado;
      lectura = gap >= 5 ? "Sobre-indexado vs. mercado" : gap <= -5 ? "Bajo cobertura vs. mercado" : "Acorde al peso del mercado";
    }
    return { region, n, pctCartera, pctMercado, lectura };
  }).sort((a, b) => b.n - a.n);

  const comunasMaster = Object.entries(REGIONES).flatMap(([region, comunas]) => comunas.map((com) => ({ region, com })));
  const comunasConCliente = new Set(misClientes.filter((c) => c.comuna).map((c) => normTxt(c.comuna)));
  const comunasCubiertas = comunasMaster.filter((m) => comunasConCliente.has(normTxt(m.com)));
  const pctCoberturaComunas = comunasMaster.length ? Math.round((comunasCubiertas.length / comunasMaster.length) * 100) : 0;
  const comunasSinPresencia = comunasMaster.filter((m) =>
    ["Metropolitana", "Valparaíso", "Coquimbo"].includes(m.region) && !comunasConCliente.has(normTxt(m.com))
  );

  const actualizar = async () => {
    setLoading(true); setErr("");
    try {
      const prompt = "Eres un asistente de inteligencia de mercado para una distribuidora de neumáticos y lubricantes de moto en Chile. " +
        "Revisa primero https://www.anim.cl/prensa (comunicados oficiales de ANIM) y luego complementa con prensa económica chilena. " +
        "Busca en la web información VIGENTE (últimos 30 días desde hoy) y responde SOLO con JSON compacto válido, sin texto fuera del JSON, sin markdown, con esta forma exacta:\n" +
        '{"animNota":"texto breve (máx 30 palabras) sobre si ANIM publicó cifras nuevas (mensuales o por marca/modelo) en los últimos 30 días, o confirma que sigue sin publicarlas",' +
        '"marketNews":[{"titulo":"","resumen":"máx 30 palabras","fuente":"","fecha":"","url":""}] (máx 3 ítems, mercado de motos en Chile),' +
        '"sportNews":[{"titulo":"","resumen":"máx 28 palabras","fuente":"","fecha":"","url":""}] (máx 6 ítems, SOLO de estos campeonatos chilenos: Copa del Rey, Nacional Chile MX, Nacional Enduro FIM Chile, Trail Trophy, Zonal Centro Enduro, 7CAP/Seven Cap Racing, Desafío del Desierto; ordenados de más reciente a más antiguo),' +
        '"pilotRankings":{"chileMX":[{"piloto":"","puntos":""}],"enduroFIM":[{"piloto":"","puntos":""}],"copaDelRey":[{"piloto":"","puntos":""}],"trailTrophy":[{"piloto":"","puntos":""}],"zonalCentro":[{"piloto":"","puntos":""}]} (top 3 de cada campeonato si existe ranking público vigente; arreglo vacío [] si no se encuentra)}\n' +
        "Si no encuentras un dato, usa arreglo vacío [] o texto breve indicando que no está disponible. No inventes cifras ni nombres.";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await r.json();
      const texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const limpio = texto.replace(/```json|```/g, "").trim();
      const m = limpio.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(m ? m[0] : limpio);
      setAi({ ...parsed, fetchedAt: new Date().toISOString() });
    } catch (e) {
      setErr("No se pudo actualizar (" + (e?.message || "error desconocido") + "). Se mantiene la información de referencia.");
    } finally {
      setLoading(false);
    }
  };

  const marketNews = ai?.marketNews?.length ? ai.marketNews : MARKET_NEWS;
  const sportNews = ai?.sportNews?.length ? ai.sportNews : SPORT_NEWS;

  return (
    <div className="stack">
      <div className="mkt-head">
        <div>
          <h2 className="mkt-h2">Información del Mercado</h2>
          <p className="muted small">Estadísticas oficiales de ANIM, prensa especializada y estudios de mercado de neumáticos y lubricantes.</p>
        </div>
      </div>

      <div className="card mkt-card mkt-update">
        <div className="mkt-update-row">
          <div>
            <div className="row-t">
              {ai?.fetchedAt
                ? "Última actualización con IA: " + new Date(ai.fetchedAt).toLocaleString("es-CL")
                : "Mostrando información de referencia (cargada manualmente el " + MKT_FECHA_ACT + ")"}
            </div>
            <div className="muted small">
              {stale ? "Han pasado " + diasDesde + " días desde la última actualización — se recomienda actualizar." :
                ai?.fetchedAt ? "Datos buscados en vivo por IA." : "Toca «Actualizar con IA» para buscar novedades de los últimos 30 días."}
            </div>
          </div>
          <Btn kind="primary" onClick={actualizar} disabled={loading}>{loading ? "Buscando…" : "🔄 Actualizar con IA"}</Btn>
        </div>
        {err && <p className="muted small" style={{ color: "var(--red)", marginTop: 8 }}>{err}</p>}
        {ai?.animNota && <p className="muted small" style={{ marginTop: 8 }}><b>ANIM:</b> {ai.animNota}</p>}
      </div>

      {/* Mercado nacional de motos */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="❖" /> Mercado nacional de motos (ANIM)</h3>
          <span className="muted small">Fuente: ANIM / Revista S Motos</span>
        </div>
        <div className="kpis">
          {ANIM_TOTAL.map((a) => (
            <Kpi key={a.anio} n={a.unidades.toLocaleString("es-CL")} l={"Motos vendidas " + a.anio + " (" + a.var + ")"}
              tone={a.var.startsWith("+") ? "green" : "amber"} />
          ))}
          <Kpi n={ANIM_IMPORT_2025.unidades.toLocaleString("es-CL")} l={"Motos importadas 2025 (" + ANIM_IMPORT_2025.var + ")"} tone="green" />
          <Kpi n="82%" l="Motos importadas 2025: China + India" />
        </div>
        <div className="grid2col" style={{ marginTop: 4 }}>
          <RankList title="Segmentos de mayor crecimiento — calle 2025 (unidades)" rows={ANIM_SEGMENTOS_2025} icon="❖"
            sub="Las motos de calle concentraron el 86,4% de las ventas 2025; estos 3 sub-segmentos fueron los de mayor alza (ANIM no desagrega el resto)." />
          <RankList title="Origen de las motos importadas (2025)" rows={ORIGEN_IMPORT_2025} icon="❖" suffix="%" />
          <RankList title="Marcas líderes — última desagregación oficial (2024)" rows={ANIM_MARCAS_2024} icon="❖" suffix="%"
            sub="ANIM no publicó el detalle por marca en el balance 2025 (ver nota más abajo)." />
          <RankList title="Modelos más vendidos (2024)" rows={ANIM_MODELOS_2024} icon="❖" suffix="%" />
          <RankList title="Ventas por mes — último trimestre 2024" rows={ANIM_MESES_2024_Q4} icon="❖" />
          <RankList title="Ventas por región (2024, último dato numérico)" rows={ANIM_REGIONES_2024} icon="❖" suffix="%"
            sub="En 2025 la RM concentró 'más de dos tercios' de las ventas, según ANIM, sin desagregar el resto de regiones." />
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          <b>Nota importante:</b> revisamos directamente <a href="https://www.anim.cl/prensa" target="_blank" rel="noreferrer">anim.cl/prensa</a> —
          el balance ANIM 2025 (publicado en feb. 2026) no incluyó venta por marca ni por modelo, y ANIM tampoco ha publicado informes mensuales en 2026.
          Por eso el detalle de marcas/modelos/meses más reciente disponible sigue siendo el oficial de 2024. Usa «Actualizar con IA» arriba para revisar si esto cambió.
        </p>
      </div>

      {/* Cruce Mercado ↔ Cartera */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="◫" /> Cruce mercado ↔ cartera ({me.role === "admin" ? "ICLA total" : "tu cartera"})</h3>
          <span className="muted small">ANIM (mercado) vs. clientes propios</span>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>
          Compara dónde está el mercado de motos en Chile con dónde está realmente tu cartera, para detectar zonas sobre-trabajadas y oportunidades sin cubrir.
        </p>
        <div className="kpis">
          <Kpi n={misClientes.length} l="Clientes activos" />
          <Kpi n={Object.keys(conteoRegionCartera).length} l="Regiones con presencia" />
          <Kpi n={pctCoberturaComunas + "%"} l="Cobertura de comunas mapeadas" tone="amber" />
          <Kpi n={comunasSinPresencia.length} l="Comunas sin presencia en RM/Valpo/Coquimbo" tone="amber" />
        </div>

        <div className="card-head" style={{ marginTop: 6 }}><h3 style={{ fontSize: 14 }}>% del mercado nacional vs. % de tu cartera, por región</h3></div>
        <div className="rows">
          {cruceRegiones.map((r) => (
            <div key={r.region} className="row">
              <div>
                <div className="row-t">{r.region} <Badge tone={r.lectura.includes("Bajo") ? "amber" : r.lectura.includes("Sobre") ? "blue" : "green"}>{r.lectura}</Badge></div>
                <div className="row-s">
                  Tu cartera: {r.pctCartera}% ({r.n} clientes){r.pctMercado != null ? " · Mercado nacional (ANIM): " + r.pctMercado + "%" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        {comunasSinPresencia.length > 0 && (
          <>
            <div className="card-head" style={{ marginTop: 14 }}><h3 style={{ fontSize: 14 }}>Comunas sin presencia en las 3 regiones de mayor mercado</h3></div>
            <p className="muted small" style={{ marginTop: -6 }}>
              Metropolitana, Valparaíso y Coquimbo concentran cerca del 76% de las ventas nacionales de motos según ANIM. Estas comunas de ese radar aún no tienen ningún cliente tuyo:
            </p>
            <div className="ig-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
              {comunasSinPresencia.map((m, i) => (
                <div key={i} className="trend-box" style={{ padding: "8px 12px" }}>
                  <b>{m.com}</b><div className="muted small">{m.region}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="muted small" style={{ marginTop: 10 }}>
          <b>Nota:</b> ANIM solo publicó el desglose regional para 3 regiones (Metropolitana, Valparaíso, Coquimbo); por eso el resto de tu cartera aparece sin comparación de mercado.
          La cobertura de comunas se calcula sobre el catálogo de comunas mapeadas en la app, no sobre el total real de comunas de Chile.
        </p>
      </div>

      {/* Lo que va de 2026 */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="↗" /> Lo que va del 2026</h3>
          <span className="muted small">ANIM</span>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>{ANIM_2026_AVANCE.texto}</p>
        <div className="trend-insight" style={{ marginTop: 4 }}>
          {ANIM_2026_AVANCE.cita}
          <div className="muted small" style={{ marginTop: 6 }}>— {ANIM_2026_AVANCE.autor}</div>
        </div>
        <p className="muted small" style={{ marginTop: 10, marginBottom: 4 }}>ANIM llama a avanzar en tres frentes para consolidar el crecimiento del sector en 2026:</p>
        <div className="ig-grid">
          {ANIM_2026_AVANCE.pide.map((p, i) => (
            <div key={i} className="trend-box" style={{ textAlign: "center" }}><b>{p}</b></div>
          ))}
        </div>
      </div>

      {/* Noticias del mercado nacional */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="▥" /> Noticias del mercado nacional</h3>
          <span className="muted small">{ai?.marketNews?.length ? "Actualizado con IA" : "ANIM · prensa económica"}</span>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>
          Incluye comunicados oficiales de ANIM (<a href="https://www.anim.cl/prensa" target="_blank" rel="noreferrer">anim.cl/prensa</a>) y cobertura de prensa económica, de más reciente a más antigua.
        </p>
        <NewsList items={marketNews} />
      </div>

      {/* Noticias del deporte nacional de motos */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="▣" /> Deporte nacional de motos</h3>
          <span className="muted small">Copa del Rey · Chile MX · Enduro FIM · Trail Trophy · Zonal Centro · 7CAP (Seven Cap) · Desafío del Desierto</span>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>Solo fechas y novedades de los últimos 30 días o próximas a disputarse, ordenadas de la más nueva a la más antigua.</p>
        <NewsList items={sportNews} />
      </div>

      {/* MotoGP — Mundial */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="◉" /> MotoGP — Mundial de Motociclismo</h3>
          <span className="muted small">Calendario · ranking de pilotos · últimas noticias</span>
        </div>
        <div className="rows" style={{ marginBottom: 14 }}>
          {MOTOGP_CALENDARIO.map((g) => (
            <div key={g.ronda} className="row">
              <div>
                <div className="row-t">{g.ronda} — {g.gp} <Badge tone={g.estado.includes("hoy") ? "green" : "amber"}>{g.estado}</Badge></div>
                <div className="row-s">{g.lugar} · {g.fecha}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid2col">
          <RankList title="Ranking de pilotos (Mundial, tras el sprint de Brno)" rows={MOTOGP_RANKING} icon="◉" sub="Puntos acumulados a falta de la carrera del domingo en Brno." />
          <div>
            <p className="muted small" style={{ marginTop: 0, marginBottom: 8, fontWeight: 700, color: "var(--txt)" }}>Últimas noticias</p>
            <NewsList items={MOTOGP_NEWS} />
          </div>
        </div>
      </div>

      {/* Ranking de pilotos */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="◬" /> Ranking de pilotos por campeonato</h3>
          <span className="muted small">{ai?.pilotRankings ? "Actualizado con IA" : "Sin datos cargados"}</span>
        </div>
        {!ai?.pilotRankings
          ? <Empty icon="◬" title="Sin ranking cargado" sub="Toca «Actualizar con IA» arriba para buscar el ranking vigente de cada campeonato." />
          : (
            <div className="grid2col">
              {PILOT_SERIES.map((s) => {
                const rows = (ai.pilotRankings[s.key] || []).map((p) => [p.piloto, p.puntos]);
                return (
                  <RankList key={s.key} title={s.label}
                    rows={rows.length ? rows : [["Sin ranking público encontrado", ""]]} icon="◬" />
                );
              })}
            </div>
          )}
      </div>

      {/* Tendencia de mercado — lubricantes y neumáticos */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="↗" /> Tendencia de mercado: potencial en lubricantes y neumáticos</h3>
          <span className="muted small">Mordor Intelligence · Informes de Expertos</span>
        </div>
        <div className="kpis">
          {TENDENCIA_STATS.map((s, i) => <Kpi key={i} n={s.n} l={s.l} tone="amber" />)}
        </div>
        <div className="grid2col" style={{ marginTop: 12 }}>
          <div className="trend-box">
            <div className="trend-title">Neumáticos en Chile</div>
            <div className="trend-big">USD 252,3M <span className="muted small">→</span> USD 483,5M</div>
            <div className="muted small">Valor de mercado 2025 proyectado a 2035 · CAGR ≈ 6,7% (2026–2035)</div>
          </div>
          <div className="trend-box">
            <div className="trend-title">Lubricantes en Chile</div>
            <div className="trend-big">CAGR &gt; 3,9%</div>
            <div className="muted small">Proyección 2024–2029 · el segmento automotriz es el mayor y de mayor crecimiento</div>
          </div>
        </div>
        <div className="trend-insight">
          <b>Lectura para ICLA:</b> el parque de motos en Chile sigue siendo marginal (3,9% del parque vehicular) frente al resto de Latinoamérica, lo que deja un amplio espacio de crecimiento a medida que la motocicleta gana terreno como solución de movilidad urbana.
          El 87% de las motos vendidas son de baja cilindrada y uso diario — el perfil que más rota neumáticos y aceite — y el 82% de las motos importadas vienen de marcas chinas e indias que se distribuyen principalmente a través de tiendas de repuestos y talleres multimarca, exactamente el canal donde opera la cartera de ICLA.
        </div>
      </div>

      {/* Instagram */}
      <div className="card mkt-card">
        <div className="card-head">
          <h3><MktIcon glyph="◐" /> Redes sociales de la empresa</h3>
        </div>
        <p className="muted small" style={{ marginTop: -6 }}>
          Por restricciones de Instagram (requiere autenticación oficial vía Meta Business API para mostrar contenido en vivo dentro de otra app),
          no es posible incrustar aquí las historias o reels del día. Usa los accesos directos para verlos en la app.
        </p>
        <div className="ig-grid">
          <a className="ig-card" href="https://www.instagram.com/icla.cl/" target="_blank" rel="noreferrer">
            <span className="ig-ico">◐</span>
            <div>
              <div className="ig-name">@icla.cl</div>
              <div className="muted small">Ver perfil e historias →</div>
            </div>
          </a>
          <a className="ig-card" href="https://www.instagram.com/iponechile/" target="_blank" rel="noreferrer">
            <span className="ig-ico">◐</span>
            <div>
              <div className="ig-name">@iponechile</div>
              <div className="muted small">Ver perfil e historias →</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Riesgo de Clientes (churn) ---------- */
const RISK_TIERS = [
  { key: "critico", label: "Crítico", min: 91, max: Infinity, tone: "red" },
  { key: "riesgo", label: "Riesgo", min: 61, max: 90, tone: "red" },
  { key: "atencion", label: "Atención", min: 31, max: 60, tone: "amber" },
  { key: "sano", label: "Sano", min: 0, max: 30, tone: "green" },
];
function tierDe(dias) {
  if (dias == null) return null;
  return RISK_TIERS.find((t) => dias >= t.min && dias <= t.max);
}

function RiesgoClientes({ db, go }) {
  const { me, clientes, visitas, users } = db;
  const [ficha, setFicha] = useState(null);
  const [fTier, setFTier] = useState("");
  const [fVend, setFVend] = useState("");
  const { setClientes } = db;
  const saveCli = (c) => { setClientes((prev) => prev.map((x) => x.id === c.id ? c : x)); setFicha(null); };

  const mine = clientes.filter((c) => (me.role === "admin" || c.vendedorId === me.id) && c.estado === "Cliente");
  const vs = visitas.filter((v) => v.estado !== "Programada");
  const addrOf = (c) => c.dirComercial || [c.comuna, c.region].filter(Boolean).join(", ");

  const data = mine.map((c) => {
    const propias = vs.filter((v) => v.clienteId === c.id).map((v) => v.fecha).sort();
    const ultima = propias[propias.length - 1];
    const dias = ultima ? daysBetween(ultima, today()) : null;
    return { c, ultima, dias, totalVisitas: propias.length, tier: tierDe(dias) };
  });

  const conDatos = data.filter((d) => d.tier);
  const sinDatos = data.filter((d) => !d.tier);
  const vendedores = users.filter((u) => u.role === "vendedor");

  const filtered = conDatos
    .filter((d) => !fTier || d.tier.key === fTier)
    .filter((d) => !fVend || d.c.vendedorId === fVend)
    .sort((a, b) => b.dias - a.dias);

  const cont = (key) => conDatos.filter((d) => d.tier.key === key).length;
  const enRiesgoPct = conDatos.length ? Math.round(((cont("riesgo") + cont("critico")) / conDatos.length) * 100) : 0;

  return (
    <div className="stack">
      <div className="mkt-head">
        <div>
          <h2 className="mkt-h2">Riesgo de pérdida de clientes</h2>
          <p className="muted small">Calculado según los días desde la última visita registrada. Solo incluye clientes con al menos una visita en el CRM.</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi n={conDatos.length} l="Clientes evaluados" />
        <Kpi n={cont("sano")} l="Sanos (≤30 días)" tone="green" />
        <Kpi n={cont("atencion")} l="Atención (31-60 días)" tone="amber" />
        <Kpi n={cont("riesgo")} l="Riesgo (61-90 días)" tone="amber" />
        <Kpi n={cont("critico")} l="Crítico (90+ días)" tone="amber" />
        <Kpi n={enRiesgoPct + "%"} l="% en riesgo o crítico" tone="amber" />
      </div>

      <div className="toolbar">
        <select value={fTier} onChange={(e) => setFTier(e.target.value)}>
          <option value="">Todo nivel de riesgo</option>
          {RISK_TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        {me.role === "admin" && (
          <select value={fVend} onChange={(e) => setFVend(e.target.value)}>
            <option value="">Todo vendedor</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        )}
        <div className="muted small">{filtered.length} cliente(s)</div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Clientes a contactar, de mayor a menor riesgo</h3></div>
        {filtered.length === 0
          ? <Empty icon="⚑" title="Nada urgente por ahora" sub="Ningún cliente cae en el filtro seleccionado." />
          : (
            <div className="rows">
              {filtered.map(({ c, ultima, dias, totalVisitas, tier }) => {
                const vend = users.find((u) => u.id === c.vendedorId);
                return (
                  <div key={c.id} className="row">
                    <div>
                      <div className="row-t">{c.nombre} <Badge tone={tier.tone}>{tier.label}</Badge></div>
                      <div className="row-s">
                        {c.comuna || "—"} · última visita: {ultima} (hace {dias} días) · {totalVisitas} visita(s) histórica(s)
                        {me.role === "admin" && vend ? " · " + vend.nombre : ""}
                      </div>
                    </div>
                    <div className="row-actions">
                      {c.telefono && <WaBtn tel={c.telefono} small />}
                      {addrOf(c) && <>
                        <a className="sel-go waze" href={wazeUrl(addrOf(c), coordOf(c))} target="_blank" rel="noreferrer" title="Waze">W</a>
                        <a className="sel-go maps" href={mapsDir(addrOf(c))} target="_blank" rel="noreferrer" title="Maps">M</a>
                      </>}
                      <Btn small onClick={() => setFicha(c)}>Ficha de Cliente</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {sinDatos.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>Sin seguimiento registrado</h3>
            <span className="muted small">{sinDatos.length} cliente(s)</span>
          </div>
          <p className="muted small" style={{ marginTop: -6 }}>
            Estos clientes no tienen ninguna visita registrada en el CRM, así que no se puede calcular su riesgo todavía. No significa que estén perdidos —
            puede que sean clientes antiguos del ERP que aún no se han visitado desde que existe esta app. Regístrales una primera visita para empezar a monitorearlos.
          </p>
        </div>
      )}

      {ficha && <ClienteForm cliente={ficha} onSave={saveCli} onClose={() => setFicha(null)} db={db} go={go} />}
    </div>
  );
}

/* ---------- Metas y Ventas ---------- */
function MetaBar({ label, meta, venta, sub }) {
  const pct = meta > 0 ? Math.round((venta / meta) * 100) : (venta > 0 ? 100 : 0);
  const tone = pct >= 100 ? "green" : pct >= 70 ? "amber" : "red";
  const widthPct = Math.min(100, pct);
  return (
    <div className="meta-row">
      <div className="meta-row-top">
        <span className="meta-label">{label}</span>
        <Badge tone={tone}>{pct}%</Badge>
      </div>
      <div className="meta-track"><div className={"meta-fill meta-" + tone} style={{ width: widthPct + "%" }} /></div>
      <div className="muted small">{fmtCLP(venta)} de meta {fmtCLP(meta)}{sub ? " · " + sub : ""}</div>
    </div>
  );
}

function MetasVentas({ db }) {
  const { me, users, metas, setMetas, ventasReales, setVentasReales } = db;
  const isAdmin = me.role === "admin";
  const [mes, setMes] = useState(today().slice(0, 7));
  const vendedores = users.filter((u) => u.role === "vendedor");
  const visibles = isAdmin ? vendedores : vendedores.filter((v) => v.id === me.id);

  const [fMeta, setFMeta] = useState({ vendedorId: visibles[0]?.id || "", marca: MARCAS[0].n, monto: "" });
  const [fVenta, setFVenta] = useState({ vendedorId: isAdmin ? (visibles[0]?.id || "") : me.id, marca: MARCAS[0].n, monto: "" });

  const metasMes = metas.filter((m) => m.mes === mes && (isAdmin || m.vendedorId === me.id));
  const ventasMes = ventasReales.filter((v) => v.mes === mes && (isAdmin || v.vendedorId === me.id));
  const sum = (arr) => arr.reduce((s, x) => s + Number(x.monto || 0), 0);

  const metaTotalMes = sum(metasMes);
  const ventaTotalMes = sum(ventasMes);

  const porVendedor = visibles.map((v) => ({
    v,
    meta: sum(metasMes.filter((m) => m.vendedorId === v.id)),
    venta: sum(ventasMes.filter((x) => x.vendedorId === v.id)),
  }));
  const porMarca = MARCAS.map((m) => ({
    marca: m.n,
    meta: sum(metasMes.filter((x) => x.marca === m.n)),
    venta: sum(ventasMes.filter((x) => x.marca === m.n)),
  })).filter((r) => r.meta > 0 || r.venta > 0);

  const guardarMeta = () => {
    if (!fMeta.vendedorId || !fMeta.marca || !Number(fMeta.monto)) return;
    setMetas((prev) => {
      const existe = prev.find((m) => m.mes === mes && m.vendedorId === fMeta.vendedorId && m.marca === fMeta.marca);
      if (existe) return prev.map((m) => m === existe ? { ...m, monto: Number(fMeta.monto) } : m);
      return [...prev, { id: uid(), mes, vendedorId: fMeta.vendedorId, marca: fMeta.marca, monto: Number(fMeta.monto) }];
    });
    setFMeta({ ...fMeta, monto: "" });
  };
  const registrarVenta = () => {
    const vendedorId = isAdmin ? fVenta.vendedorId : me.id;
    if (!vendedorId || !fVenta.marca || !Number(fVenta.monto)) return;
    setVentasReales((prev) => [...prev, { id: uid(), mes, vendedorId, marca: fVenta.marca, monto: Number(fVenta.monto) }]);
    setFVenta({ ...fVenta, monto: "" });
  };
  const borrarMeta = (id) => setMetas((prev) => prev.filter((m) => m.id !== id));
  const borrarVenta = (id) => setVentasReales((prev) => prev.filter((v) => v.id !== id));
  const nombreVend = (id) => users.find((u) => u.id === id)?.nombre || "—";

  return (
    <div className="stack">
      <div className="toolbar">
        <Field label="Mes"><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></Field>
        <div className="muted small">{isAdmin ? "Vista completa ICLA" : "Tu desempeño personal"}</div>
      </div>

      <div className="kpis">
        <Kpi n={fmtCLP(metaTotalMes)} l="Meta total del mes" />
        <Kpi n={fmtCLP(ventaTotalMes)} l="Venta real del mes" tone="green" />
        <Kpi n={(metaTotalMes ? Math.round((ventaTotalMes / metaTotalMes) * 100) : 0) + "%"}
          l="Cumplimiento del mes" tone="amber" />
        <Kpi n={visibles.length} l={isAdmin ? "Vendedores" : "Tu equipo"} />
      </div>

      {isAdmin && (
        <div className="card">
          <div className="card-head"><h3>Cumplimiento por vendedor</h3></div>
          {porVendedor.every((r) => r.meta === 0 && r.venta === 0)
            ? <Empty icon="✦" title="Sin metas ni ventas este mes" sub="Define una meta o registra una venta más abajo." />
            : porVendedor.map((r) => <MetaBar key={r.v.id} label={r.v.nombre} meta={r.meta} venta={r.venta} />)}
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Cumplimiento por marca</h3></div>
        {porMarca.length === 0
          ? <Empty icon="✦" title="Sin metas ni ventas por marca este mes" />
          : porMarca.map((r) => <MetaBar key={r.marca} label={r.marca} meta={r.meta} venta={r.venta} />)}
      </div>

      {isAdmin && (
        <div className="card">
          <div className="card-head"><h3>Definir meta</h3></div>
          <div className="grid2">
            <Field label="Vendedor">
              <select value={fMeta.vendedorId} onChange={(e) => setFMeta({ ...fMeta, vendedorId: e.target.value })}>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Field>
            <Field label="Marca">
              <select value={fMeta.marca} onChange={(e) => setFMeta({ ...fMeta, marca: e.target.value })}>
                {MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}
              </select>
            </Field>
            <Field label="Meta del mes (CLP)">
              <input type="number" value={fMeta.monto} onChange={(e) => setFMeta({ ...fMeta, monto: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
            <Btn kind="primary" onClick={guardarMeta}>Guardar meta</Btn>
          </div>
          {metasMes.length > 0 && (
            <div className="rows" style={{ marginTop: 10 }}>
              {metasMes.map((m) => (
                <div key={m.id} className="row">
                  <div className="row-t">{nombreVend(m.vendedorId)} · {m.marca}</div>
                  <div className="row-actions"><b>{fmtCLP(m.monto)}</b><button className="x sm" onClick={() => borrarMeta(m.id)}>✕</button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Registrar venta real</h3></div>
        <div className="grid2">
          {isAdmin && (
            <Field label="Vendedor">
              <select value={fVenta.vendedorId} onChange={(e) => setFVenta({ ...fVenta, vendedorId: e.target.value })}>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </Field>
          )}
          <Field label="Marca">
            <select value={fVenta.marca} onChange={(e) => setFVenta({ ...fVenta, marca: e.target.value })}>
              {MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}
            </select>
          </Field>
          <Field label="Monto vendido (CLP)">
            <input type="number" value={fVenta.monto} onChange={(e) => setFVenta({ ...fVenta, monto: e.target.value })} placeholder="0" />
          </Field>
        </div>
        <p className="muted small" style={{ marginTop: -2 }}>Registro manual — puedes ir sumando varias ventas del mismo mes y marca, se acumulan.</p>
        <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
          <Btn kind="primary" onClick={registrarVenta}>Registrar venta</Btn>
        </div>
        {ventasMes.length > 0 && (
          <div className="rows" style={{ marginTop: 10 }}>
            {ventasMes.map((v) => (
              <div key={v.id} className="row">
                <div className="row-t">{isAdmin ? nombreVend(v.vendedorId) + " · " : ""}{v.marca}</div>
                <div className="row-actions"><b>{fmtCLP(v.monto)}</b><button className="x sm" onClick={() => borrarVenta(v.id)}>✕</button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="muted small">
        Nota: como ICLA aún no tiene integración con su sistema de facturación, las ventas reales se registran a mano aquí.
        Si más adelante conectas un ERP, este módulo puede alimentarse automáticamente en vez de ingresarlo manualmente.
      </p>
    </div>
  );
}

/* ---------- Monitoreo de Precios de Competencia ---------- */
const CANALES_PRECIO = ["Mercado Libre", "Falabella", "Sodimac", "Tienda física", "Sitio web marca", "Otro"];
function emptyPrecioObs(me) {
  return { id: uid(), fecha: today(), tipo: "Competencia", marca: "", producto: "", canal: CANALES_PRECIO[0], precio: "", url: "", notas: "", creadoPor: me.id };
}
function normProd(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }

function MonitoreoPrecios({ db }) {
  const { me, monitoreo, setMonitoreo } = db;
  const [form, setForm] = useState(emptyPrecioObs(me));
  const [q, setQ] = useState("");
  const [fDias, setFDias] = useState("365");
  const [buscandoML, setBuscandoML] = useState(false);
  const [resultadosML, setResultadosML] = useState(null);
  const [errML, setErrML] = useState("");

  const buscarMercadoLibre = async () => {
    if (!form.producto.trim()) { setErrML("Escribe primero qué producto buscar."); return; }
    setBuscandoML(true); setErrML(""); setResultadosML(null);
    try {
      const termino = (form.marca + " " + form.producto).trim();
      const prompt = "Busca en mercadolibre.cl (usa site:mercadolibre.cl en la búsqueda) publicaciones vigentes para: \"" + termino + "\". " +
        "Es para una distribuidora de neumáticos y lubricantes de moto en Chile, así que prioriza resultados de ese rubro. " +
        "Responde SOLO con un JSON compacto válido, sin texto fuera del JSON, sin markdown, con esta forma exacta: " +
        '{"resultados":[{"titulo":"","precio":0,"vendedor":"","url":""}]} (máx 5 resultados, precio como número entero en CLP sin signos ni puntos). ' +
        "Si no encuentras nada relevante, responde {\"resultados\":[]}. No inventes precios ni links.";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await r.json();
      const texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const limpio = texto.replace(/```json|```/g, "").trim();
      const m = limpio.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(m ? m[0] : limpio);
      setResultadosML(parsed.resultados || []);
    } catch (e) {
      setErrML("No se pudo buscar en Mercado Libre (" + (e?.message || "error desconocido") + "). Puedes ingresar el precio a mano.");
    } finally {
      setBuscandoML(false);
    }
  };
  const usarResultado = (r) => {
    setForm((f) => ({ ...f, precio: r.precio || f.precio, url: r.url || f.url, marca: f.marca || "" }));
    setResultadosML(null);
  };

  const enRango = (fecha) => fDias === "todo" || daysBetween(fecha, today()) <= Number(fDias);
  const filtradas = monitoreo
    .filter((m) => enRango(m.fecha))
    .filter((m) => !q || (m.producto + " " + m.marca).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const grupos = {};
  filtradas.forEach((m) => {
    const k = normProd(m.producto);
    if (!k) return;
    (grupos[k] = grupos[k] || { producto: m.producto, items: [] }).items.push(m);
  });
  const resumen = Object.values(grupos).map((g) => {
    const comp = g.items.filter((i) => i.tipo === "Competencia").map((i) => Number(i.precio)).filter((n) => n > 0);
    const propios = g.items.filter((i) => i.tipo === "Propio").sort((a, b) => b.fecha.localeCompare(a.fecha));
    const tuPrecio = propios[0] ? Number(propios[0].precio) : null;
    const min = comp.length ? Math.min(...comp) : null;
    const max = comp.length ? Math.max(...comp) : null;
    const avg = comp.length ? Math.round(comp.reduce((s, n) => s + n, 0) / comp.length) : null;
    const gap = tuPrecio && avg ? Math.round(((tuPrecio - avg) / avg) * 100) : null;
    return { ...g, min, max, avg, tuPrecio, gap, n: comp.length };
  }).sort((a, b) => b.items.length - a.items.length);

  const guardar = () => {
    if (!form.producto || !Number(form.precio)) return;
    setMonitoreo((prev) => [...prev, { ...form, id: uid(), creadoPor: me.id }]);
    setForm(emptyPrecioObs(me));
  };
  const borrar = (id) => setMonitoreo((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="stack">
      <div className="mkt-head">
        <div>
          <h2 className="mkt-h2">Monitoreo de precios de competencia</h2>
          <p className="muted small">Registra precios propios y de la competencia por producto y canal, para llevar el control en el tiempo en vez de un Excel suelto.</p>
        </div>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Buscar producto o marca…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fDias} onChange={(e) => setFDias(e.target.value)}>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
          <option value="365">Último año</option>
          <option value="todo">Todo el historial</option>
        </select>
        <div className="muted small">{filtradas.length} registro(s)</div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Agregar observación de precio</h3></div>
        <div className="grid2">
          <Field label="Tipo">
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Competencia">Competencia</option>
              <option value="Propio">Propio (ICLA)</option>
            </select>
          </Field>
          <Field label="Canal">
            <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}>
              {CANALES_PRECIO.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Marca"><input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Motul, Ipone…" /></Field>
          <Field label="Producto"><input value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} placeholder="Ej: Aceite 4T 20W50 1L" /></Field>
          <Field label="Precio observado (CLP)"><input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="0" /></Field>
          <Field label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
          <Field label="Link (opcional)"><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>
          <div className="full"><Field label="Notas (opcional)"><input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></Field></div>
        </div>

        {form.canal === "Mercado Libre" && (
          <div className="ml-search">
            <Btn onClick={buscarMercadoLibre} disabled={buscandoML}>{buscandoML ? "Buscando en Mercado Libre…" : "🔍 Buscar en Mercado Libre"}</Btn>
            {errML && <p className="muted small" style={{ color: "var(--red)", marginTop: 8 }}>{errML}</p>}
            {resultadosML && resultadosML.length === 0 && <p className="muted small" style={{ marginTop: 8 }}>Sin resultados relevantes. Ingresa el precio a mano.</p>}
            {resultadosML && resultadosML.length > 0 && (
              <div className="rows" style={{ marginTop: 10 }}>
                {resultadosML.map((r, i) => (
                  <div key={i} className="row">
                    <div>
                      <div className="row-t">{r.titulo}</div>
                      <div className="row-s">{r.vendedor || "Vendedor no identificado"} · {fmtCLP(r.precio)}</div>
                    </div>
                    <div className="row-actions">
                      {r.url && <Btn small as="a" href={r.url} target="_blank">Ver</Btn>}
                      <Btn small kind="primary" onClick={() => usarResultado(r)}>Usar este precio</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
          <Btn kind="primary" onClick={guardar} disabled={!form.producto || !Number(form.precio)}>Guardar observación</Btn>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Resumen por producto (mín · promedio · máx de competencia)</h3></div>
        {resumen.length === 0
          ? <Empty icon="◭" title="Sin observaciones aún" sub="Agrega precios propios y de competencia para ver el comparativo." />
          : (
            <div className="rows">
              {resumen.map((g) => (
                <div key={g.producto} className="row">
                  <div>
                    <div className="row-t">{g.producto}</div>
                    <div className="row-s">
                      {g.n > 0 ? "Competencia — mín " + fmtCLP(g.min) + " · prom " + fmtCLP(g.avg) + " · máx " + fmtCLP(g.max) + " (" + g.n + " obs.)" : "Sin observaciones de competencia"}
                      {g.tuPrecio != null ? " · Tu precio: " + fmtCLP(g.tuPrecio) : ""}
                    </div>
                  </div>
                  {g.gap != null && (
                    <Badge tone={g.gap > 5 ? "red" : g.gap < -5 ? "green" : "amber"}>
                      {g.gap > 0 ? "+" + g.gap + "% más caro" : g.gap < 0 ? g.gap + "% más barato" : "Igual al promedio"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="card">
        <div className="card-head"><h3>Historial de observaciones</h3></div>
        {filtradas.length === 0 ? <Empty icon="◭" title="Sin registros en este período" /> : (
          <div className="rows">
            {filtradas.map((m) => (
              <div key={m.id} className="row">
                <div>
                  <div className="row-t">{m.producto} <Badge tone={m.tipo === "Propio" ? "blue" : "amber"}>{m.tipo}</Badge></div>
                  <div className="row-s">{m.marca || "—"} · {m.canal} · {m.fecha}{m.notas ? " · " + m.notas : ""}</div>
                </div>
                <div className="row-actions">
                  {m.url && <Btn small as="a" href={m.url} target="_blank">Ver link</Btn>}
                  <b>{fmtCLP(m.precio)}</b>
                  <button className="x sm" onClick={() => borrar(m.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Tienda B2B ---------- */
const FAMILIAS_PROD = ["Aceite 4T – Essential","Aceite 4T – Semi Sintético Plus","Aceite 4T – 100% Sintético Road","Aceite 4T – Off Road","Aceite 4T – Racing","Aceite 2T","Ipone Care Line – Moto","Neumáticos – Big Trail","Neumáticos – Enduro/MX","Neumáticos – Sport Urbano","Neumáticos – Scooter","Neumáticos – Custom/Harley","Neumáticos – ATV/UTV"];
const ESTADOS_PEDIDO = ["Pendiente", "Confirmado", "En preparación", "Despachado", "Entregado", "Cancelado"];
const ESTADO_PEDIDO_TONE = { Pendiente: "amber", Confirmado: "blue", "En preparación": "blue", Despachado: "green", Entregado: "green", Cancelado: "red" };
const METODOS_PAGO = ["Transferencia bancaria", "Crédito (factura)", "Contado"];
function precioCliente(base, cat, descs) {
  const pct = Number(descs?.[String(cat)] ?? 0);
  return Math.round(base * (1 - pct / 100));
}
function numPedido(arr) { return "PED-" + String((arr?.length || 0) + 1).padStart(4, "0"); }
function numCotiz(arr) { return "COT-" + String((arr?.length || 0) + 1).padStart(4, "0"); }

function ProductoCard({ prod, cat, descs, onAdd, esAdmin, onEdit }) {
  const precio = precioCliente(prod.precioBase, cat, descs);
  const descPct = Number(descs?.[String(cat)] ?? 0);
  return (
    <div className="prod-card">
      <div className="prod-img">{prod.imagen ? <img src={prod.imagen} alt={prod.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : <span className="prod-img-ico">{prod.familia === "Neumáticos" ? "◎" : "◈"}</span>}</div>
      {prod.destacado && <span className="prod-badge-dest">Destacado</span>}
      <div className="prod-body">
        <div className="prod-marca">{prod.marca} · {prod.familia}</div>
        <div className="prod-nombre">{prod.nombre}</div>
        <div className="prod-sku muted small">SKU: {prod.sku}</div>
        {prod.descripcion && <p className="prod-desc muted small">{prod.descripcion}</p>}
        <div className="prod-precio-row">
          <div>
            <div className="prod-precio">{fmtCLP(precio)}<span className="prod-unit"> / {prod.unidad}</span></div>
            {descPct > 0 && <div className="prod-base-precio muted small">Base: {fmtCLP(prod.precioBase)} · Dcto: {descPct}%</div>}
          </div>
          <Badge tone={prod.stock > 10 ? "green" : prod.stock > 0 ? "amber" : "red"}>{prod.stock > 0 ? prod.stock + " disp." : "Sin stock"}</Badge>
        </div>
        <div className="prod-actions">
          {esAdmin
            ? <Btn small onClick={() => onEdit(prod)}>Editar</Btn>
            : <Btn small kind="primary" onClick={() => onAdd(prod)} disabled={prod.stock === 0}>+ Agregar</Btn>}
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ db, carrito, setCarrito, onClose }) {
  const { me, clientes, pedidos, setPedidos, descsCat } = db;
  const cliData = clientes.find((c) => c.email === me.email) || null;
  const cat = cliData?.categoria || "5";
  const [metodo, setMetodo] = useState(METODOS_PAGO[cat === "5" ? 2 : 0]);
  const [notas, setNotas] = useState("");
  const [done, setDone] = useState(false);
  const [pedidoNum, setPedidoNum] = useState("");

  const items = carrito.map((item) => ({
    ...item,
    precioUnit: precioCliente(item.precioBase, cat, descsCat),
    descPct: Number(descsCat?.[String(cat)] ?? 0),
    total: precioCliente(item.precioBase, cat, descsCat) * item.qty,
  }));
  const total = items.reduce((s, i) => s + i.total, 0);

  const confirmar = () => {
    const num = numPedido(pedidos);
    const p = {
      id: uid(), numero: num, clienteId: cliData?.id || me.id, clienteNombre: me.nombre,
      fecha: today(), estado: "Pendiente", items, subtotal: total, total,
      metodoPago: metodo, notas, vendedorId: cliData?.vendedorId || "",
    };
    setPedidos((prev) => [...prev, p]);
    setPedidoNum(num);
    setCarrito([]);
    setDone(true);
  };

  if (done) return (
    <Modal title="¡Pedido confirmado!" onClose={onClose}>
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h3 style={{ marginBottom: 8 }}>{pedidoNum}</h3>
        <p className="muted small">Tu pedido fue enviado a ICLA. Te contactarán para confirmar despacho y coordinar el pago.</p>
        <div className="modal-foot"><Btn kind="primary" onClick={onClose}>Cerrar</Btn></div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Confirmar pedido" onClose={onClose} wide>
      <div className="rows" style={{ marginBottom: 12 }}>
        {items.map((it) => (
          <div key={it.id} className="row">
            <div><div className="row-t">{it.nombre}</div><div className="row-s">{it.qty} {it.unidad} × {fmtCLP(it.precioUnit)}</div></div>
            <b>{fmtCLP(it.total)}</b>
          </div>
        ))}
        <div className="row"><b>Total</b><b style={{ color: "var(--amber)", fontSize: 18 }}>{fmtCLP(total)}</b></div>
      </div>
      <Field label="Método de pago">
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>
      <Field label="Notas (dirección de despacho, observaciones, etc.)">
        <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional…" />
      </Field>
      <p className="muted small">Al confirmar, tu pedido queda pendiente de validación por ICLA. Recibirás confirmación de tu vendedor asignado.</p>
      <div className="modal-foot">
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn kind="primary" onClick={confirmar} disabled={items.length === 0}>Confirmar pedido {fmtCLP(total)}</Btn>
      </div>
    </Modal>
  );
}

function CotizacionModal({ db, carrito, setCarrito, onClose }) {
  const { me, clientes, cotizaciones, setCotizaciones, descsCat } = db;
  const cliData = clientes.find((c) => c.email === me.email) || null;
  const cat = cliData?.categoria || "5";
  const [mensaje, setMensaje] = useState("");
  const [done, setDone] = useState(false);
  const [cotNum, setCotNum] = useState("");

  const items = carrito.map((it) => ({ ...it, precioUnit: precioCliente(it.precioBase, cat, descsCat) }));

  const enviar = () => {
    const num = numCotiz(cotizaciones);
    setCotizaciones((prev) => [...prev, {
      id: uid(), numero: num, clienteId: cliData?.id || me.id, clienteNombre: me.nombre,
      fecha: today(), items, mensaje, estado: "Recibida", vendedorId: cliData?.vendedorId || "",
    }]);
    setCotNum(num); setCarrito([]); setDone(true);
  };

  if (done) return (
    <Modal title="Cotización enviada" onClose={onClose}>
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✉</div>
        <h3 style={{ marginBottom: 8 }}>{cotNum}</h3>
        <p className="muted small">Tu solicitud de cotización fue enviada. Tu vendedor te responderá a la brevedad.</p>
        <div className="modal-foot"><Btn kind="primary" onClick={onClose}>Cerrar</Btn></div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Solicitar cotización" onClose={onClose} wide>
      <div className="rows" style={{ marginBottom: 12 }}>
        {items.map((it) => <div key={it.id} className="row"><div className="row-t">{it.nombre}</div><div className="row-s">{it.qty} {it.unidad}</div></div>)}
      </div>
      <Field label="Mensaje para tu vendedor">
        <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Volumen estimado, plazos, condiciones especiales…" />
      </Field>
      <div className="modal-foot">
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn kind="primary" onClick={enviar}>Enviar cotización</Btn>
      </div>
    </Modal>
  );
}

function TiendaCliente({ db, initTab }) {
  const { me, clientes, productos, pedidos, cotizaciones, descsCat } = db;
  const [tab, setTab] = useState(initTab || "catalogo");
  const [carrito, setCarrito] = useState([]);
  const [q, setQ] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fFam, setFFam] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [cotizModal, setCotizModal] = useState(false);
  const [showCarrito, setShowCarrito] = useState(false);

  const cliData = clientes.find((c) => c.email === me.email) || null;
  const cat = cliData?.categoria || "5";
  const descPct = Number(descsCat?.[String(cat)] ?? 0);
  const misPedidos = pedidos.filter((p) => p.clienteId === (cliData?.id || me.id)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const misCotiz = cotizaciones.filter((c) => c.clienteId === (cliData?.id || me.id)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const marcas = [...new Set(productos.filter((p) => p.activo).map((p) => p.marca))].sort();

  const prods = productos.filter((p) => p.activo)
    .filter((p) => !q || (p.nombre + " " + p.sku + " " + p.marca).toLowerCase().includes(q.toLowerCase()))
    .filter((p) => !fMarca || p.marca === fMarca)
    .filter((p) => !fFam || p.familia === fFam);

  const addCarrito = (prod) => {
    setCarrito((prev) => {
      const ex = prev.find((i) => i.id === prod.id);
      return ex ? prev.map((i) => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...prod, qty: 1 }];
    });
  };
  const qtyCarrito = carrito.reduce((s, i) => s + i.qty, 0);
  const totalCarrito = carrito.reduce((s, i) => s + precioCliente(i.precioBase, cat, descsCat) * i.qty, 0);

  return (
    <div className="stack">
      <div className="mkt-head">
        <div>
          <h2 className="mkt-h2">Tienda ICLA</h2>
          <p className="muted small">Bienvenido, {me.nombre} · Cat {cat} ({descPct > 0 ? descPct + "% descuento" : "sin descuento"}) · {cliData ? cliData.nombre : "Sin empresa asociada"}</p>
        </div>
        {carrito.length > 0 && (
          <button className="carrito-btn" onClick={() => setShowCarrito(true)}>
            🛒 {qtyCarrito} ítem(s) · {fmtCLP(totalCarrito)}
          </button>
        )}
      </div>

      <div className="store-tabs">
        {[["catalogo","Catálogo"],["mispedidos","Mis Pedidos (" + misPedidos.length + ")"],["miscotiz","Cotizaciones (" + misCotiz.length + ")"]].map(([k,l]) => (
          <button key={k} className={"store-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "catalogo" && <>
        <div className="toolbar">
          <input className="search" placeholder="Buscar producto, SKU, marca…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={fMarca} onChange={(e) => setFMarca(e.target.value)}><option value="">Toda marca</option>{marcas.map((m) => <option key={m}>{m}</option>)}</select>
          <select value={fFam} onChange={(e) => setFFam(e.target.value)}><option value="">Toda familia</option>{FAMILIAS_PROD.map((f) => <option key={f}>{f}</option>)}</select>
          <div className="muted small">{prods.length} producto(s)</div>
        </div>
        {prods.length === 0 ? <Empty icon="◉" title="Sin productos" sub="Ajusta los filtros." /> : (
          <div className="prod-grid">
            {prods.map((p) => <ProductoCard key={p.id} prod={p} cat={cat} descs={descsCat} onAdd={addCarrito} />)}
          </div>
        )}
        {carrito.length > 0 && (
          <div className="carrito-float">
            <div><b>🛒 {qtyCarrito} ítem(s)</b> · {fmtCLP(totalCarrito)}</div>
            <div className="row-actions">
              <Btn small onClick={() => setCotizModal(true)}>Cotizar</Btn>
              <Btn small kind="primary" onClick={() => setCheckout(true)}>Hacer pedido</Btn>
            </div>
          </div>
        )}
      </>}

      {tab === "mispedidos" && (
        misPedidos.length === 0
          ? <Empty icon="▦" title="Sin pedidos" sub="Tus pedidos confirmados aparecerán aquí." />
          : <div className="rows">{misPedidos.map((p) => (
              <div key={p.id} className="row">
                <div>
                  <div className="row-t">{p.numero} <Badge tone={ESTADO_PEDIDO_TONE[p.estado] || "amber"}>{p.estado}</Badge></div>
                  <div className="row-s">{p.fecha} · {p.items.length} ítem(s) · {fmtCLP(p.total)} · {p.metodoPago}</div>
                  {p.notas && <div className="row-s muted small">{p.notas}</div>}
                </div>
              </div>
            ))}</div>
      )}

      {tab === "miscotiz" && (
        misCotiz.length === 0
          ? <Empty icon="▤" title="Sin cotizaciones" sub="Tus cotizaciones enviadas aparecerán aquí." />
          : <div className="rows">{misCotiz.map((c) => (
              <div key={c.id} className="row">
                <div>
                  <div className="row-t">{c.numero} <Badge tone="amber">{c.estado}</Badge></div>
                  <div className="row-s">{c.fecha} · {c.items.length} producto(s)</div>
                  {c.mensaje && <div className="row-s muted small">{c.mensaje}</div>}
                </div>
              </div>
            ))}</div>
      )}

      {showCarrito && (
        <Modal title={"Carrito (" + qtyCarrito + " ítems)"} onClose={() => setShowCarrito(false)} wide>
          <div className="rows">
            {carrito.map((it) => {
              const pu = precioCliente(it.precioBase, cat, descsCat);
              return (
                <div key={it.id} className="row">
                  <div><div className="row-t">{it.nombre}</div><div className="row-s">{fmtCLP(pu)} / {it.unidad}</div></div>
                  <div className="row-actions">
                    <button className="qty-btn" onClick={() => setCarrito((p) => p.map((x) => x.id === it.id && x.qty > 1 ? { ...x, qty: x.qty - 1 } : x))}>−</button>
                    <span>{it.qty}</span>
                    <button className="qty-btn" onClick={() => setCarrito((p) => p.map((x) => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                    <b>{fmtCLP(pu * it.qty)}</b>
                    <button className="x sm" onClick={() => setCarrito((p) => p.filter((x) => x.id !== it.id))}>✕</button>
                  </div>
                </div>
              );
            })}
            <div className="row"><b>Total</b><b style={{ color: "var(--amber)", fontSize: 18 }}>{fmtCLP(totalCarrito)}</b></div>
          </div>
          <div className="modal-foot">
            <Btn onClick={() => setCotizModal(true)}>Solicitar cotización</Btn>
            <Btn kind="primary" onClick={() => { setShowCarrito(false); setCheckout(true); }}>Confirmar pedido</Btn>
          </div>
        </Modal>
      )}
      {checkout && <CheckoutModal db={db} carrito={carrito} setCarrito={setCarrito} onClose={() => setCheckout(false)} />}
      {cotizModal && <CotizacionModal db={db} carrito={carrito} setCarrito={setCarrito} onClose={() => setCotizModal(false)} />}
    </div>
  );
}

function ProductoForm({ prod, onSave, onClose }) {
  const [p, setP] = useState(prod || {
    id: uid(), sku: "", nombre: "", marca: MARCAS[0].n, familia: FAMILIAS_PROD[0],
    descripcion: "", precioBase: "", stock: "", unidad: "Un.", activo: true, destacado: false, imagen: "",
  });
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  return (
    <Modal title={prod ? "Editar producto" : "Nuevo producto"} onClose={onClose} wide>
      <div className="grid2">
        <Field label="SKU"><input value={p.sku} onChange={(e) => set("sku", e.target.value)} placeholder="IPO-KAT-1L" /></Field>
        <Field label="Nombre"><input value={p.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
        <Field label="Marca"><select value={p.marca} onChange={(e) => set("marca", e.target.value)}>{MARCAS.map((m) => <option key={m.n}>{m.n}</option>)}</select></Field>
        <Field label="Familia"><select value={p.familia} onChange={(e) => set("familia", e.target.value)}>{FAMILIAS_PROD.map((f) => <option key={f}>{f}</option>)}</select></Field>
        <Field label="Precio base (CLP)"><input type="number" value={p.precioBase} onChange={(e) => set("precioBase", Number(e.target.value))} /></Field>
        <Field label="Stock"><input type="number" value={p.stock} onChange={(e) => set("stock", Number(e.target.value))} /></Field>
        <Field label="Unidad"><input value={p.unidad} onChange={(e) => set("unidad", e.target.value)} placeholder="Un., Pack, L…" /></Field>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input type="checkbox" checked={p.activo} onChange={(e) => set("activo", e.target.checked)} /> Activo (visible en tienda)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={p.destacado} onChange={(e) => set("destacado", e.target.checked)} /> Producto destacado
          </label>
        </div>
        <div className="full"><Field label="Descripción"><textarea rows={2} value={p.descripcion} onChange={(e) => set("descripcion", e.target.value)} /></Field></div>
      </div>
      <div className="modal-foot">
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn kind="primary" onClick={() => onSave(p)} disabled={!p.sku || !p.nombre}>Guardar</Btn>
      </div>
    </Modal>
  );
}

function Tienda({ db }) {
  const { me, productos, setProductos, pedidos, setPedidos, cotizaciones, setCotizaciones, descsCat, setDescsCat, clientes } = db;
  const [tab, setTab] = useState("pedidos");
  const [editProd, setEditProd] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [q, setQ] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fFam, setFFam] = useState("");
  const [fEstado, setFEstado] = useState("");
  const isAdmin = me.role === "admin";

  const saveProd = (p) => {
    setProductos((prev) => prev.some((x) => x.id === p.id) ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]);
    setEditProd(null); setShowNuevo(false);
  };
  const delProd = (id) => setProductos((prev) => prev.filter((p) => p.id !== id));
  const setEstadoPedido = (id, estado) => setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, estado } : p));
  const setEstadoCotiz = (id, estado) => setCotizaciones((prev) => prev.map((c) => c.id === id ? { ...c, estado } : c));

  const prodsFilt = productos
    .filter((p) => !q || (p.nombre + " " + p.sku + " " + p.marca).toLowerCase().includes(q.toLowerCase()))
    .filter((p) => !fMarca || p.marca === fMarca)
    .filter((p) => !fFam || p.familia === fFam);
  const pedidosFilt = pedidos.filter((p) => !fEstado || p.estado === fEstado).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const marcas = [...new Set(productos.map((p) => p.marca))].sort();

  const kpiPedidos = (estado) => pedidos.filter((p) => p.estado === estado).length;
  const totalPendiente = pedidos.filter((p) => p.estado === "Pendiente").reduce((s, p) => s + p.total, 0);

  return (
    <div className="stack">
      <div className="mkt-head">
        <div><h2 className="mkt-h2">Ventas · Tienda B2B</h2><p className="muted small">Gestión de productos, pedidos y cotizaciones de clientes.</p></div>
      </div>
      <div className="kpis">
        <Kpi n={productos.filter((p) => p.activo).length} l="Productos activos" />
        <Kpi n={kpiPedidos("Pendiente")} l="Pedidos pendientes" tone="amber" />
        <Kpi n={fmtCLP(totalPendiente)} l="Total en pedidos pendientes" tone="amber" />
        <Kpi n={kpiPedidos("Entregado")} l="Entregados" tone="green" />
        <Kpi n={cotizaciones.filter((c) => c.estado === "Recibida").length} l="Cotizaciones sin responder" tone="amber" />
      </div>

      <div className="store-tabs">
        {[["pedidos","Pedidos"],["cotizaciones","Cotizaciones"],["productos","Catálogo"],["precios","Descuentos por categoría"]].map(([k,l]) => (
          <button key={k} className={"store-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "pedidos" && <>
        <div className="toolbar">
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}><option value="">Todo estado</option>{ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}</select>
          <div className="muted small">{pedidosFilt.length} pedido(s)</div>
        </div>
        {pedidosFilt.length === 0 ? <Empty icon="▦" title="Sin pedidos" /> : (
          <div className="rows">
            {pedidosFilt.map((p) => (
              <div key={p.id} className="row">
                <div>
                  <div className="row-t">{p.numero} — {p.clienteNombre} <Badge tone={ESTADO_PEDIDO_TONE[p.estado] || "amber"}>{p.estado}</Badge></div>
                  <div className="row-s">{p.fecha} · {p.items.length} ítem(s) · {fmtCLP(p.total)} · {p.metodoPago}</div>
                  {p.notas && <div className="row-s muted small">{p.notas}</div>}
                  <div className="row-s">{p.items.slice(0, 2).map((i) => i.nombre).join(" · ")}{p.items.length > 2 ? " …" : ""}</div>
                </div>
                {isAdmin && (
                  <Field label="">
                    <select value={p.estado} onChange={(e) => setEstadoPedido(p.id, e.target.value)} style={{ minWidth: 140 }}>
                      {ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            ))}
          </div>
        )}
      </>}

      {tab === "cotizaciones" && <>
        {cotizaciones.length === 0 ? <Empty icon="▤" title="Sin cotizaciones" /> : (
          <div className="rows">
            {[...cotizaciones].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((c) => (
              <div key={c.id} className="row">
                <div>
                  <div className="row-t">{c.numero} — {c.clienteNombre} <Badge tone="amber">{c.estado}</Badge></div>
                  <div className="row-s">{c.fecha} · {c.items.length} producto(s)</div>
                  {c.mensaje && <div className="row-s muted small">"{c.mensaje}"</div>}
                  <div className="row-s">{c.items.slice(0, 2).map((i) => i.nombre + " ×" + i.qty).join(" · ")}</div>
                </div>
                {isAdmin && (
                  <Field label="">
                    <select value={c.estado} onChange={(e) => setEstadoCotiz(c.id, e.target.value)} style={{ minWidth: 140 }}>
                      {["Recibida", "En revisión", "Respondida", "Cerrada"].map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            ))}
          </div>
        )}
      </>}

      {tab === "productos" && <>
        <div className="toolbar">
          <input className="search" placeholder="Buscar SKU, nombre, marca…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={fMarca} onChange={(e) => setFMarca(e.target.value)}><option value="">Toda marca</option>{marcas.map((m) => <option key={m}>{m}</option>)}</select>
          <select value={fFam} onChange={(e) => setFFam(e.target.value)}><option value="">Toda familia</option>{FAMILIAS_PROD.map((f) => <option key={f}>{f}</option>)}</select>
          {isAdmin && <Btn kind="primary" onClick={() => setShowNuevo(true)}>+ Nuevo producto</Btn>}
        </div>
        {prodsFilt.length === 0 ? <Empty icon="◉" title="Sin productos" /> : (
          <div className="prod-grid">
            {prodsFilt.map((p) => <ProductoCard key={p.id} prod={p} cat="1" descs={descsCat} esAdmin onEdit={setEditProd} />)}
          </div>
        )}
      </>}

      {tab === "precios" && isAdmin && (
        <div className="card">
          <div className="card-head"><h3>Descuento % por categoría de cliente</h3></div>
          <p className="muted small">El precio final del cliente = precio base × (1 − descuento%). Cat 5 (Contado) no recibe descuento por defecto.</p>
          <div className="grid2">
            {Object.entries(CATEGORIAS.reduce((o, k) => ({ ...o, [k]: descsCat?.[k] ?? 0 }), {})).map(([cat, pct]) => (
              <Field key={cat} label={"Cat " + cat + " — " + CAT_LABELS[cat]}>
                <div className="row-actions" style={{ gap: 8 }}>
                  <input type="number" min="0" max="100" value={pct} style={{ width: 80 }}
                    onChange={(e) => setDescsCat((d) => ({ ...d, [cat]: Number(e.target.value) }))} />
                  <span className="muted small">%</span>
                  <span className="muted small">Precio final Cat {cat}: {fmtCLP(precioCliente(10000, cat, descsCat))} sobre base $10.000</span>
                </div>
              </Field>
            ))}
          </div>
        </div>
      )}
      {tab === "precios" && !isAdmin && <Empty icon="₵" title="Solo el admin puede editar los descuentos." />}

      {(editProd || showNuevo) && <ProductoForm prod={editProd || null} onSave={saveProd} onClose={() => { setEditProd(null); setShowNuevo(false); }} />}
    </div>
  );
}

/* ---------- Equipo / Admin ---------- */
function Equipo({ db }) {
  const { users, setUsers, catSolicitudes, setCatSolicitudes, clientes, setClientes } = db;
  const [open, setOpen] = useState(null);
  const empty = { id: uid(), role: "vendedor", nombre: "", email: "", pass: "", cargo: CARGOS[0], marcas: [], zonas: { regiones: [], ciudades: [] } };
  const save = (u) => { setUsers((p) => p.some((x) => x.id === u.id) ? p.map((x) => x.id === u.id ? u : x) : [...p, u]); setOpen(null); };
  const del = (id) => { if (confirm("¿Eliminar este usuario?")) setUsers((p) => p.filter((x) => x.id !== id)); };
  const allCiudades = Object.entries(REGIONES).flatMap(([r, cs]) => cs);

  const pendientes = catSolicitudes.filter((s) => s.estado === "Pendiente").sort((a, b) => b.fecha.localeCompare(a.fecha));
  const resolverCat = (s, aprobar) => {
    setCatSolicitudes((prev) => prev.map((x) => x.id === s.id ? { ...x, estado: aprobar ? "Aprobada" : "Rechazada" } : x));
    if (aprobar) setClientes((prev) => prev.map((c) => c.id === s.clienteId ? { ...c, categoria: s.categoriaSolicitada } : c));
  };

  return (
    <div className="stack">
      {pendientes.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Solicitudes de cambio de categoría</h3><Badge tone="amber">{pendientes.length} pendiente(s)</Badge></div>
          <div className="rows">
            {pendientes.map((s) => (
              <div key={s.id} className="row">
                <div>
                  <div className="row-t">{s.clienteNombre} · Cat {s.categoriaActual} → Cat {s.categoriaSolicitada} ({CAT_LABELS[s.categoriaSolicitada]})</div>
                  <div className="row-s">{s.motivo} — solicitado por {s.vendedorNombre}, {s.fecha}</div>
                </div>
                <div className="row-actions">
                  <Btn small onClick={() => resolverCat(s, false)}>Rechazar</Btn>
                  <Btn small kind="primary" onClick={() => resolverCat(s, true)}>Aprobar</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="toolbar"><div /><Btn kind="primary" onClick={() => setOpen({ ...empty, id: uid() })}>+ Nuevo usuario</Btn></div>
      <div className="rows">
        {users.map((u) => (
          <div key={u.id} className="row">
            <div>
              <div className="row-t">{u.nombre} <Badge tone={u.role === "admin" ? "amber" : u.role === "cliente" ? "blue" : "n"}>{u.role}</Badge></div>
              <div className="row-s">{u.email} · {u.cargo} · marcas: {(u.marcas || []).join(", ") || "—"}</div>
              <div className="row-s">zonas: {[...(u.zonas?.regiones || []), ...(u.zonas?.ciudades || [])].join(", ") || "—"}</div>
            </div>
            <div className="row-actions">
              <Btn small onClick={() => setOpen(u)}>Editar</Btn>
              {u.role !== "admin" && <button className="x sm" onClick={() => del(u.id)}>✕</button>}
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal wide title={open.nombre || "Nuevo usuario"} onClose={() => setOpen(null)}>
          <EquipoForm u={open} onSave={save} allCiudades={allCiudades} />
        </Modal>
      )}
    </div>
  );
}
function EquipoForm({ u, onSave, allCiudades }) {
  const [x, setX] = useState(u);
  const set = (k, v) => setX((p) => ({ ...p, [k]: v }));
  return (
    <div className="stack">
      <div className="grid2">
        <Field label="Nombre"><input value={x.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
        <Field label="Rol"><select value={x.role} onChange={(e) => set("role", e.target.value)}>{["vendedor", "admin", "cliente"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Correo"><input value={x.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Contraseña"><input value={x.pass} onChange={(e) => set("pass", e.target.value)} /></Field>
        <Field label="Cargo"><select value={x.cargo} onChange={(e) => set("cargo", e.target.value)}>{CARGOS.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      {x.role === "vendedor" && <>
        <Field label="Marcas asignadas"><MultiChips options={MARCAS.map((m) => m.n)} value={x.marcas} onChange={(v) => set("marcas", v)} /></Field>
        <Field label="Regiones asignadas"><MultiChips options={Object.keys(REGIONES)} value={x.zonas.regiones} onChange={(v) => set("zonas", { ...x.zonas, regiones: v })} /></Field>
        <Field label="Ciudades / comunas asignadas">
          <MultiChips options={allCiudades} value={x.zonas.ciudades} onChange={(v) => set("zonas", { ...x.zonas, ciudades: v })} />
        </Field>
      </>}
      <div className="modal-foot"><Btn kind="primary" onClick={() => onSave(x)} disabled={!x.nombre || !x.email}>Guardar usuario</Btn></div>
    </div>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */
function Styles() {
  return (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@600;700&display=swap');
    :root{
      --asphalt:#FFFFFF; --carbon:#FFFFFF; --panel:#F7F7F8; --panel2:#EFEFF1;
      --line:#E2E4E8; --txt:#1A1D23; --muted:#6B7280; --amber:#E08C1A; --amber-d:#B36E10;
      --green:#16A34A; --red:#DC2626;
      --green:#16A34A; --red:#DC2626; --blue:#2563EB; --waze:#0EA5E9; --maps:#16A34A;
      --shadow:0 8px 24px rgba(0,0,0,.12);
    }
    *{box-sizing:border-box}
    body,html,#root{margin:0;height:100%}
    .app{display:flex;min-height:100vh;background:var(--asphalt);color:var(--txt);
      font-family:'Archivo',system-ui,sans-serif;font-size:14px}
    button,input,select,textarea{font-family:inherit}

    /* SIDEBAR */
    .side{width:248px;flex-shrink:0;background:#16181C;border-right:1px solid #2A2F37;
      display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
    .brand{display:flex;gap:11px;align-items:center;padding:20px 18px;border-bottom:1px solid var(--line)}
    .brand-col{flex-direction:column;align-items:flex-start;gap:8px}
    .logo-chip{display:inline-flex;background:#fff;border-radius:9px;padding:6px 9px;line-height:0;
      box-shadow:0 4px 12px rgba(0,0,0,.25)}
    .brand-mark{display:flex;align-items:center;justify-content:center;line-height:0;
      filter:drop-shadow(0 4px 10px rgba(242,163,60,.25))}
    .brand-mark.big{}
    .brand-name{font-family:'Archivo Narrow';font-weight:800;letter-spacing:.5px;font-size:19px;line-height:1}
    .brand-name.big{font-size:30px}
    .brand-name span{color:var(--amber)}
    .brand-sub{font-size:11px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:1px}
    .nav{flex:1;padding:12px 10px;overflow-y:auto}
    .nav-i{display:flex;align-items:center;gap:11px;width:100%;border:0;background:transparent;color:#8C95A3;
      padding:11px 12px;border-radius:9px;text-align:left;cursor:pointer;font-size:13.5px;font-weight:500;margin-bottom:2px}
    .nav-i:hover{background:rgba(255,255,255,.08);color:#ECEEF1}
    .nav-i.on{background:rgba(242,163,60,.15);color:#F2A33C}
    .nav-i.on .nav-ico{color:#F2A33C}
    .nav-badge{margin-left:auto;background:var(--red);color:#fff;font-size:11px;font-weight:700;
      border-radius:20px;min-width:19px;height:19px;display:flex;align-items:center;justify-content:center;padding:0 5px;flex-shrink:0}
    .nav-ico{width:20px;text-align:center;font-size:15px}
    .side-foot{border-top:1px solid #2A2F37;padding:14px}
    .me{display:flex;gap:10px;align-items:center;margin-bottom:10px}
    .me-av{width:34px;height:34px;border-radius:50%;background:var(--amber);color:#1a1a1a;display:grid;place-items:center;font-weight:700}
    .me-n{font-weight:600;font-size:13px;color:#ECEEF1}.me-r{font-size:11px;color:#8C95A3}
    .logout{width:100%;background:transparent;border:1px solid #343A44;color:#8C95A3;
      padding:8px;border-radius:8px;cursor:pointer;font-size:12.5px}
    .logout:hover{border-color:#DC2626;color:#DC2626}

    /* MAIN */
    .main{flex:1;min-width:0;display:flex;flex-direction:column}
    .topbar{display:flex;align-items:center;gap:14px;padding:0 22px;height:58px;border-bottom:1px solid var(--line);
      background:var(--carbon);position:sticky;top:0;z-index:5}
    .topbar-title{font-family:'Archivo Narrow';font-weight:700;font-size:19px;flex:1}
    .topbar-tag{font-size:11px;color:var(--amber);text-transform:uppercase;letter-spacing:1px;
      border:1px solid var(--line);padding:5px 10px;border-radius:20px}
    .burger{display:none;background:transparent;border:0;color:var(--txt);font-size:22px;cursor:pointer}
    .content{padding:22px;max-width:1180px;width:100%}
    .stack{display:flex;flex-direction:column;gap:18px}

    /* CARDS / KPI */
    .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
    .quick-access{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
    .qa{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--carbon);
      border:1px solid var(--line);border-radius:12px;padding:16px;color:var(--txt);cursor:pointer;
      font-family:'Archivo Narrow',sans-serif;font-weight:700;font-size:16px;transition:.15s}
    .qa:hover{border-color:var(--amber);transform:translateY(-2px)}
    .qa-ico{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;font-size:17px;
      background:rgba(242,163,60,.14);color:var(--amber)}
    .kpi{background:var(--carbon);border:1px solid var(--line);border-radius:12px;padding:16px}
    .kpi-n{font-family:'Archivo Narrow';font-size:30px;font-weight:800;line-height:1}
    .kpi-l{font-size:11.5px;color:var(--muted);margin-top:6px;text-transform:uppercase;letter-spacing:.5px}
    .kpi-amber .kpi-n{color:var(--amber)} .kpi-green .kpi-n{color:var(--green)}
    .card{background:var(--carbon);border:1px solid var(--line);border-radius:14px;padding:18px}
    .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .card-head h3{margin:0;font-family:'Archivo Narrow';font-size:17px;font-weight:700}
    .muted{color:var(--muted)} .small{font-size:12px} .muted.small{font-weight:400}
    .sub-h{margin:18px 0 8px;font-family:'Archivo Narrow';color:var(--amber)}

    .brand-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
    .brand-pill{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px}
    .dot{width:9px;height:9px;border-radius:50%}.dot.amber{background:var(--amber)}.dot.blue{background:var(--blue)}
    .bp-n{font-weight:600}.bp-t{font-size:11px;color:var(--muted)}
    .bp-desc{font-size:11px;color:var(--amber);font-weight:700;margin-left:4px}

    /* ROWS */
    .rows{display:flex;flex-direction:column;gap:8px}
    .row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--panel);
      border:1px solid var(--line);border-radius:10px;padding:12px 14px}
    .row-t{font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .row-s{font-size:12.5px;color:var(--muted);margin-top:3px}
    .row-actions{display:flex;gap:6px;flex-shrink:0}
    .row-actions.col{flex-direction:column;align-items:stretch;gap:7px}
    .row-actions.col .action-top{display:flex;gap:6px;align-items:center;justify-content:flex-end}
    .row-actions.col .btn{justify-content:center}
    .total{padding:10px 0 0;font-size:13px;color:var(--muted)}.total b{color:var(--amber);font-size:15px}

    /* TOOLBAR / SEARCH */
    .toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .search{flex:1;min-width:120px}
    input,select,textarea{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--txt);
      border-radius:9px;padding:10px 12px;font-size:13.5px;outline:none}
    input:focus,select:focus,textarea:focus{border-color:var(--amber)}
    textarea{resize:vertical}
    .search-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px}
    .search-row .field{flex:0 0 auto;min-width:160px}

    /* BUTTONS */
    .btn{border:1px solid var(--line);background:var(--panel);color:var(--txt);border-radius:9px;
      padding:10px 15px;font-size:13.5px;font-weight:600;cursor:pointer;text-decoration:none;
      display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:.15s}
    .btn:hover{border-color:var(--muted)}
    .btn-primary{background:var(--amber);border-color:var(--amber);color:#1a1300}
    .btn-primary:hover{background:var(--amber-d);border-color:var(--amber-d)}
    .btn-primary:disabled{opacity:.45;cursor:not-allowed}
    .btn-waze{background:rgba(51,204,255,.12);border-color:var(--waze);color:var(--waze)}
    .btn-maps{background:rgba(52,168,83,.12);border-color:var(--maps);color:#6ed98a}
    .btn-sm{padding:6px 11px;font-size:12px}

    /* GRID / FIELDS */
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .grid2 .full{grid-column:1/-1}
    .field{display:flex;flex-direction:column;gap:5px}
    .field-label{font-size:12px;color:var(--muted);font-weight:600}
    .field-hint{font-size:11px;color:var(--muted)}

    /* CHIPS */
    .chips{display:flex;flex-wrap:wrap;gap:7px}
    .chip{background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:20px;
      padding:6px 13px;font-size:12.5px;cursor:pointer}
    .chip.on{background:var(--amber);border-color:var(--amber);color:#1a1300;font-weight:600}

    /* CLIENTE CARDS */
    .cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
    .cli-card{background:var(--carbon);border:1px solid var(--line);border-radius:12px;padding:15px;cursor:pointer;transition:.15s}
    .cli-card:hover{border-color:var(--amber);transform:translateY(-2px)}
    .cli-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .cli-name{font-weight:700;font-size:15px}
    .cli-meta{font-size:12px;color:var(--muted);margin-top:4px}
    .cli-segs{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}
    .cli-actions{display:flex;gap:6px;margin-top:11px}

    /* BADGES */
    .badge{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:3px 8px;border-radius:6px;
      background:var(--panel2);color:var(--muted);border:1px solid var(--line)}
    .badge-green{background:rgba(70,194,139,.15);color:var(--green);border-color:transparent}
    .badge-amber{background:rgba(242,163,60,.15);color:var(--amber);border-color:transparent}
    .badge-red{background:rgba(226,104,91,.15);color:var(--red);border-color:transparent}
    .badge-blue{background:rgba(91,169,232,.15);color:var(--blue);border-color:transparent}

    /* MODAL */
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);display:grid;
      place-items:center;padding:18px;z-index:50}
    .modal{background:var(--carbon);border:1px solid var(--line);border-radius:16px;width:520px;max-width:100%;
      max-height:90vh;display:flex;flex-direction:column;box-shadow:var(--shadow)}
    .modal-wide{width:720px}
    .modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--line)}
    .modal-head h3{margin:0;font-family:'Archivo Narrow';font-size:19px}
    .modal-body{padding:20px;overflow-y:auto}
    .modal-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
    .merge-foot{justify-content:space-between;align-items:center}
    .merge-foot .foot-right{display:flex;gap:10px}
    .x{background:transparent;border:0;color:var(--muted);font-size:18px;cursor:pointer;line-height:1}
    .x:hover{color:var(--red)} .x.sm{font-size:13px}

    /* TABS */
    .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:16px;overflow-x:auto}
    .tab{background:transparent;border:0;border-bottom:2px solid transparent;color:var(--muted);
      padding:10px 14px;cursor:pointer;font-size:13.5px;font-weight:600;white-space:nowrap}
    .tab.on{color:var(--amber);border-bottom-color:var(--amber)}

    /* SEGMENT */
    .seg{display:flex;background:var(--panel);border:1px solid var(--line);border-radius:9px;overflow:hidden}
    .seg-b{background:transparent;border:0;color:var(--muted);padding:8px 16px;cursor:pointer;font-weight:600;font-size:13px}
    .seg-b.on{background:var(--amber);color:#1a1300}

    /* SUBFORM (mkt) */
    .subform{display:grid;grid-template-columns:1fr 1fr 1fr 2fr auto;gap:10px;align-items:end;
      background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px}

    /* PHOTOS */
    .photos{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .photobox-l{font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:600}
    .photobox img{width:100%;height:130px;object-fit:cover;border-radius:10px;cursor:pointer;border:1px solid var(--line)}
    .photo-empty{width:100%;height:130px;border:1px dashed var(--line);background:var(--panel);border-radius:10px;
      color:var(--muted);cursor:pointer}
    .route-btns,.route-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .route-actions{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}

    /* PLAN VISITAS: buscador + selección + mapa */
    .cli-search{position:relative;margin-bottom:8px}
    .cli-results{margin-top:8px;max-height:260px;overflow-y:auto;border:1px solid var(--line);
      border-radius:10px;background:var(--panel);display:flex;flex-direction:column}
    .cli-res{display:flex;align-items:center;gap:12px;background:transparent;border:0;border-bottom:1px solid var(--line);
      padding:11px 13px;cursor:pointer;text-align:left;color:var(--txt)}
    .cli-res:last-child{border-bottom:0}
    .cli-res:hover{background:var(--panel2)}
    .cli-res-n{font-weight:600;flex:1}
    .cli-res-s{font-size:12px;color:var(--muted)}
    .cli-res-add{font-size:12px;font-weight:700;color:var(--amber);white-space:nowrap}
    .cli-none{padding:14px;color:var(--muted);font-size:13px}
    .sel-head{font-family:'Archivo Narrow';font-size:15px;font-weight:700;margin:14px 0 8px;
      display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .sel-head .muted{font-weight:400}
    .link-btn{background:transparent;border:0;color:var(--amber);font-weight:700;font-size:12.5px;
      cursor:pointer;font-family:'Archivo',sans-serif;padding:0}
    .link-btn:hover{text-decoration:underline}
    .sel-list{display:flex;flex-direction:column;gap:8px}
    .sel-row{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);
      border-radius:10px;padding:10px 12px}
    .sel-num{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--amber);color:#1a1300;
      font-weight:800;font-size:12px;display:grid;place-items:center}
    .sel-info{flex:1;min-width:0}
    .sel-n{font-weight:600}
    .sel-s{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sel-go{width:28px;height:28px;flex-shrink:0;border-radius:7px;display:grid;place-items:center;
      font-weight:800;font-size:13px;text-decoration:none;border:1px solid var(--line)}
    .sel-go.waze{color:var(--waze);background:rgba(51,204,255,.12);border-color:var(--waze)}
    .sel-go.maps{color:#6ed98a;background:rgba(52,168,83,.12);border-color:var(--maps)}
    .sel-go.wa{color:#25D366;background:rgba(37,211,102,.12);border-color:#25D366}
    .contact-row{display:flex;align-items:flex-end;gap:8px}
    .contact-row .field{flex:1}
    .sel-nogo{width:28px;height:28px;flex-shrink:0;display:grid;place-items:center;color:var(--muted);opacity:.5}
    .route-map-wrap{margin-top:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
    .route-map{width:100%;height:320px;border:0;display:block}

    /* VISITAS */
    .cal{display:flex;flex-direction:column;gap:12px}
    .cal-group{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--carbon)}
    .cal-head{display:flex;align-items:center;gap:12px;padding:11px 13px;background:var(--panel2);border-bottom:1px solid var(--line)}
    .cal-date{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:48px;
      background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:5px 4px}
    .cal-date .d{font-size:20px;font-weight:800;line-height:1;color:var(--amber);font-family:'Archivo Narrow',sans-serif}
    .cal-date .m{font-size:10px;text-transform:uppercase;color:var(--muted);letter-spacing:.5px;margin-top:2px}
    .cal-title{flex:1;min-width:0}
    .cal-title .wd{font-weight:700;font-size:14px;text-transform:capitalize;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .cal-title .ct{font-size:12px;color:var(--muted);margin-top:2px}
    .cal-visits{display:flex;flex-direction:column}
    .cal-visit{display:flex;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid var(--line);transition:.12s}
    .cal-visit:last-child{border-bottom:none}
    .cal-visit:hover{background:var(--panel2)}
    .cal-num{width:24px;height:24px;flex-shrink:0;display:grid;place-items:center;border-radius:50%;
      background:rgba(242,163,60,.15);color:var(--amber);font-size:12px;font-weight:700}
    .cal-v-info{flex:1;min-width:0}
    .cal-v-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}

    /* SEGUIMIENTO / AVANCE DE LEADS */
    .funnel-list{display:flex;flex-direction:column;gap:12px}
    .funnel-card{background:var(--carbon);border:1px solid var(--line);border-radius:14px;padding:14px 16px;cursor:pointer;transition:.15s}
    .funnel-card:hover{border-color:var(--amber);box-shadow:var(--shadow)}
    .funnel-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .funnel-name{font-weight:700;font-size:14.5px}
    .funnel-sub{font-weight:400;color:var(--muted);font-size:13px}
    .funnel-meta{font-size:12px;color:var(--muted);margin-top:2px;margin-bottom:14px}
    .stepper{display:flex;align-items:flex-start;gap:0;margin-bottom:12px}
    .step{display:flex;flex-direction:column;align-items:center;min-width:74px;text-align:center}
    .step-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;
      background:var(--panel2);color:var(--muted);border:1px solid var(--line);flex-shrink:0}
    .step.done .step-dot{background:rgba(70,194,139,.18);color:var(--green);border-color:transparent}
    .step.current .step-dot{background:rgba(242,163,60,.2);color:var(--amber);border-color:var(--amber)}
    .step-label{font-size:11.5px;font-weight:600;margin-top:5px;display:inline-flex;align-items:center;gap:3px}
    .step.current .step-label{color:var(--amber)}
    .step.done .step-label{color:var(--green)}
    .step-date{font-size:10.5px;color:var(--muted);margin-top:1px;white-space:nowrap}
    .step-info{border:none;background:transparent;color:var(--muted);font-size:11px;cursor:pointer;
      padding:0;line-height:1;flex-shrink:0}
    .step-info:hover{color:var(--amber)}
    .funnel-move{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0}
    .pipe-arrow{width:28px;height:28px;border-radius:7px;border:1px solid var(--line);background:var(--panel2);
      color:var(--txt);font-size:17px;cursor:pointer;line-height:1}
    .pipe-arrow:hover:not(:disabled){border-color:var(--amber);color:var(--amber)}
    .pipe-arrow:disabled{opacity:.3;cursor:not-allowed}
    .step-line{flex:1;height:2px;background:var(--line);margin-top:13px;min-width:18px}
    .step-line.done{background:var(--green)}
    .funnel-stats{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--line)}
    .mini-progress{padding:14px}

    /* TIENDA B2B */
    .store-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    .store-tab{padding:8px 16px;border-radius:8px;border:1px solid var(--line);background:var(--panel);
      color:var(--muted);cursor:pointer;font-size:13px;font-weight:600;transition:.15s}
    .store-tab.on{border-color:var(--amber);color:var(--amber);background:rgba(242,163,60,.1)}
    .store-tab:hover{border-color:var(--amber)}
    .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
    @media(max-width:600px){.prod-grid{grid-template-columns:1fr}}
    .prod-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.15s;position:relative}
    .prod-card:hover{border-color:var(--amber);transform:translateY(-2px)}
    .prod-img{height:140px;background:var(--panel2);display:flex;align-items:center;justify-content:center}
    .prod-img-ico{font-size:40px;opacity:.4}
    .prod-badge-dest{position:absolute;top:8px;right:8px;background:var(--amber);color:#1a1a1a;
      font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;text-transform:uppercase}
    .prod-body{padding:12px}
    .prod-marca{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
    .prod-nombre{font-weight:700;font-size:14px;line-height:1.3;margin-bottom:2px}
    .prod-sku{margin-bottom:4px}
    .prod-desc{margin:4px 0 8px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .prod-precio-row{display:flex;align-items:flex-end;justify-content:space-between;margin:8px 0}
    .prod-precio{font-size:18px;font-weight:800;color:var(--amber)}
    .prod-unit{font-size:12px;font-weight:400;color:var(--muted)}
    .prod-base-precio{font-size:11px}
    .prod-actions{margin-top:8px}
    .carrito-btn{background:var(--amber);color:#1a1a1a;border:none;padding:10px 18px;border-radius:10px;
      font-weight:700;font-size:13.5px;cursor:pointer;flex-shrink:0}
    .carrito-float{position:sticky;bottom:0;background:var(--panel);border:1px solid var(--amber);
      border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;
      flex-wrap:wrap;gap:10px;box-shadow:var(--shadow);z-index:10}
    .qty-btn{width:28px;height:28px;border-radius:7px;border:1px solid var(--line);background:var(--panel2);
      color:var(--txt);font-size:16px;cursor:pointer}
    .qty-btn:hover{border-color:var(--amber)}
    .mini-progress .stepper{margin-bottom:0}
    .funnel-ops{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .funnel-stat{font-size:12px;color:var(--muted)}
    .funnel-stat.good{color:var(--green);font-weight:600}
    .funnel-kpis .kpi-n{font-size:24px}

    /* REPORTES — análisis de mercado */
    .grid2col{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
    @media(max-width:900px){.grid2col{grid-template-columns:1fr}}
    .rank-list{display:flex;flex-direction:column;gap:9px}
    .rank-row{display:flex;align-items:center;gap:10px}
    .rank-pos{width:20px;flex-shrink:0;text-align:center;font-size:11.5px;font-weight:700;color:var(--muted)}
    .rank-info{flex:1;min-width:0}
    .rank-label{font-size:12.5px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rank-bar-track{height:6px;border-radius:4px;background:var(--panel2);overflow:hidden}
    .rank-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--amber-d),var(--amber))}
    .rank-count{width:34px;text-align:right;font-weight:700;font-size:13px;flex-shrink:0}

    /* INFORMACIÓN DEL MERCADO */
    .mkt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:2px}
    .mkt-h2{font-family:'Archivo Narrow';font-size:22px;margin:0 0 4px}
    .mkt-card .card-head h3{display:flex;align-items:center;gap:8px}
    .mkt-ico{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:7px;
      background:rgba(242,163,60,.15);color:var(--amber);font-size:13px;flex-shrink:0}
    .news-list{display:flex;flex-direction:column;gap:10px}
    .news-item{display:block;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;
      text-decoration:none;color:inherit;transition:.15s}
    .news-item:hover{border-color:var(--amber)}
    .news-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .news-title{font-weight:700;font-size:13.5px;line-height:1.35}
    .news-go{color:var(--amber);font-size:14px;flex-shrink:0}
    .news-sum{font-size:12.5px;color:var(--muted);margin:6px 0 8px;line-height:1.5}
    .news-meta{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.3px}
    .trend-box{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
    .trend-title{font-weight:700;font-size:13px;margin-bottom:8px}
    .trend-big{font-family:'Archivo Narrow';font-size:21px;font-weight:800;color:var(--amber);margin-bottom:4px}
    .trend-insight{margin-top:14px;background:rgba(242,163,60,.08);border:1px solid rgba(242,163,60,.25);
      border-radius:12px;padding:14px;font-size:12.5px;line-height:1.6;color:var(--txt)}
    .ig-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    @media(max-width:600px){.ig-grid{grid-template-columns:1fr}}
    .ig-card{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);
      border-radius:12px;padding:14px;text-decoration:none;color:inherit;transition:.15s}
    .ig-card:hover{border-color:var(--amber)}
    .ig-ico{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:18px;flex-shrink:0;
      background:linear-gradient(135deg,#F2A33C,#E2685B,#5BA9E8);color:#16181C}
    .ig-name{font-weight:700;font-size:14px}
    .mkt-update{background:rgba(242,163,60,.06);border-color:rgba(242,163,60,.3)}
    .mkt-update-row{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}

    /* METAS Y VENTAS */
    .meta-row{margin-bottom:14px}
    .meta-row-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}
    .meta-label{font-weight:700;font-size:13.5px}
    .meta-track{height:9px;border-radius:5px;background:var(--panel2);overflow:hidden;margin-bottom:4px}
    .meta-fill{height:100%;border-radius:5px;transition:.3s}
    .meta-fill.meta-green{background:var(--green)}
    .meta-fill.meta-amber{background:var(--amber)}
    .meta-fill.meta-red{background:var(--red)}
    .ml-search{margin-top:10px;padding-top:14px;border-top:1px solid var(--line)}
    .vis-done{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
    .vis-done-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .vis-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .vis-thumbs img{width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--line)}
    .vis-photo-grid{display:flex;gap:10px;flex-wrap:wrap}
    .vis-photo{position:relative}
    .vis-photo img{width:84px;height:84px;object-fit:cover;border-radius:9px;border:1px solid var(--line)}
    .vis-photo-x{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;border:0;
      background:var(--red);color:#fff;font-size:11px;cursor:pointer;line-height:1}
    .vis-photo-add{width:84px;height:84px;border:1px dashed var(--line);border-radius:9px;background:var(--panel2);
      color:var(--muted);display:grid;place-items:center;cursor:pointer;font-size:13px;font-weight:600}
    .vis-photo-add:hover{border-color:var(--amber);color:var(--amber)}

    /* ROUTE PICK */
    .route-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;max-height:340px;overflow-y:auto;margin-top:10px}
    .pick{display:flex;flex-direction:column;gap:2px;background:var(--panel);border:1px solid var(--line);
      border-radius:9px;padding:10px 12px;cursor:pointer;position:relative}
    .pick.on{border-color:var(--amber)}
    .pick input{position:absolute;top:10px;right:10px;width:auto}
    .pick-n{font-weight:600;padding-right:22px}.pick-s{font-size:11.5px;color:var(--muted)}

    /* MKT cards */
    .mkt-card{background:var(--carbon);border:1px solid var(--line);border-radius:12px;overflow:hidden}
    .mkt-card img{width:100%;height:150px;object-fit:cover}
    .mkt-file{height:150px;display:grid;place-items:center;background:var(--panel);color:var(--muted)}
    .mkt-body{padding:13px;display:flex;flex-direction:column;gap:6px}

    /* EMPTY */
    .empty{text-align:center;padding:40px 16px;color:var(--muted)}
    .empty-ico{font-size:34px;opacity:.5;margin-bottom:10px}
    .empty-t{font-weight:600;color:var(--txt);margin:0}
    .empty-s{font-size:13px;margin:6px 0 0}

    /* SPLASH / LOGIN */
    .splash{min-height:100vh;display:grid;place-items:center;background:var(--asphalt);color:var(--muted)}
    .splash-logo{display:flex;justify-content:center;margin:0 auto 14px;line-height:0;
      filter:drop-shadow(0 6px 16px rgba(242,163,60,.3))}
    .login{min-height:100vh;display:grid;place-items:center;padding:20px;
      background:radial-gradient(circle at 20% 0%,#222730,var(--asphalt))}
    .login-card{background:var(--carbon);border:1px solid var(--line);border-radius:18px;padding:34px;width:380px;max-width:100%;
      display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow)}
    .login-brand{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px}
    .login-sub{color:var(--muted);font-size:13px;margin:0 0 6px}
    .login-hint{font-size:12px;color:var(--muted);text-align:center;margin:4px 0 0}
    .err{color:var(--red);font-size:13px;margin:0}
    .scrim{display:none}

    /* IMPORT */
    .dropzone{width:100%;border:1px dashed var(--line);background:var(--panel);border-radius:12px;
      padding:34px;color:var(--muted);cursor:pointer;display:flex;flex-direction:column;gap:6px;align-items:center}
    .dropzone:hover{border-color:var(--amber);color:var(--txt)}
    .dz-ico{font-size:30px;color:var(--amber)}
    .seed-load{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
      border-top:1px solid var(--line);padding-top:14px;margin-top:4px}
    .prev-wrap{max-height:320px;overflow:auto;border:1px solid var(--line);border-radius:10px}
    .prev{width:100%;border-collapse:collapse;font-size:12.5px}
    .prev th{position:sticky;top:0;background:var(--panel2);text-align:left;padding:9px 11px;color:var(--muted);font-weight:700;white-space:nowrap}
    .prev td{padding:8px 11px;border-top:1px solid var(--line)}
    .prev tr:hover td{background:var(--panel)}

    /* RESPONSIVE */
    @media(max-width:980px){.kpis{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:860px){
      .side{position:fixed;left:0;top:0;z-index:40;transform:translateX(-100%);transition:.25s}
      .side.open{transform:translateX(0)}
      .burger{display:block}
      .scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:30}
      .grid2{grid-template-columns:1fr}
      .subform{grid-template-columns:1fr 1fr}
      .photos{grid-template-columns:1fr}
    }
    @media(max-width:520px){
      .kpis{grid-template-columns:repeat(2,1fr)}
      .content{padding:14px}
      .toolbar{flex-wrap:wrap}
      .subform{grid-template-columns:1fr}
    }
    `}</style>
  );
}
