// tableOrders.ts

export const tableOrders: Record<string, string[]> = {
    f_cfg: ['codcfg', 'numcfg', 'texcfg', 'tipcfg'],
    f_sec: ["codsec", "dessec", "suwsec",  "mptsec", "ordsec"],/* "imasec", */
    f_art: [
      "codart", "eanart", "equart", "ccoart", "famart", "desart", "deeart", "detart", "phaart", "tivart",
      "pcoart", "dt0art", "dt1art", "dt2art", "falart", "mdaart", "ubiart", "uelart", "uppart", "dimart",
      "memart", "obsart", "npuart", "niaart", "comart", "cp1art", "cp2art", "cp3art", "refart", "dlaart",
      "ipuart", "nccart", "cucart", "canart", "imgart", "suwart", "delart", "dewart", "mewart", "cstart",
      "imwart", "stoart", "fumart", "pesart", "fteart", "acoart", "garart", "umeart", "tmoart", "conart",
      "tiv2art", "de1art", "de2art", "de3art", "dfiart", "rpuart", "rpfart", "rcuart", "rcfart", "mecart",
      "dscart", "amaart", "caeart", "ufsart", "imfart", "pfiart", "mptart", "cp4art", "cp5art", "ordart",
      "ueqart", "dcoart", "favart", "dstart", "vewart", "uraart", "vmpart", "ur1art", "ur2art", "ur3art",
      "cn8art", "ocuart", "rsvart", "nvsart", "depart", "sdeart", "casart", "halart", "ualart", "humart", "uumart"
    ],
    f_fam: ["codfam", "desfam", "secfam", "texfam", "cuefam", "cucfam", "suwfam","imafam", "imffam", "mptfam", "pfifam", "ordfam", "rtifam", "depfam", "sdefam"],/* "imafam" */
    f_cli: [
      'codcli','ccocli','nifcli','nofcli','noccli','domcli','pobcli','cpocli','procli','telcli','faxcli','pcocli',
      'agecli','bancli','entcli','oficli','dcocli','cuecli','fpacli','fincli','ppacli','tarcli','dp1cli','dp2cli','dp3cli',
      'tclcli','dt1cli','dt2cli','dt3cli','tescli','cprcli','tpocli','porcli','ivacli','tivcli','reqcli','falcli','emacli',
      'webcli','memcli','obscli','horcli','vdecli','vhacli','crfcli','nvccli','nfccli','niccli','moncli','paicli','doccli',
      'dbacli','pbacli','swfcli','co1cli','co2cli','co3cli','co4cli','co5cli','im1cli','im2cli','im3cli','im4cli','im5cli',
      'rutcli','swicli','gircli','cuwcli','cawcli','suwcli','mewcli','estcli','ar1cli','ar2cli','ar3cli','ar4cli','ar5cli',
      'felcli','tracli','ncfcli','fnacli','fotcli','skycli','no1cli','tf1cli','em1cli','no2cli','tf2cli','em2cli','no3cli',
      'tf3cli','em3cli','no4cli','tf4cli','em4cli','no5cli','tf5cli','em5cli','retcli','ctmcli','mnpcli','ificli','impcli',
      'ncacli','camcli','co6cli','im6cli','ar6cli','co7cli','im7cli','ar7cli','co8cli','im8cli','ar8cli','co9cli','im9cli',
      'ar9cli','co10cli','im10cli','ar10cli','co11cli','im11cli','ar11cli','co12cli','im12cli','ar12cli','me1cli','me2cli',
      'me3cli','me4cli','me5cli','me6cli','me7cli','me8cli','me9cli','me10cli','me11cli','me12cli','cascli','emocli','precli',
      'dtccli','epetcli','ereccli','eclicli','epagcli','fumcli','pgccli','rescli','rficli','pracli','actcli','ecocli','ecncli',
      'eadcli','twicli','a1kcli','movcli','cpfcli','rcccli','mutcli','mrecli','mfecli','aco1cli','ado1cli', 'acp1cli', 'apo1cli', 'apr1cli',
       'apa1cli', 'aco2cli', 'ado2cli', 'acp2cli', 'apo2cli', 'apr2cli', 'apa2cli', 'aco3cli', 'ado3cli', 'acp3cli', 'apo3cli', 'apr3cli', 'apa3cli', 'ieucli',
        'aco4cli', 'ado4cli', 'acp4cli', 'apo4cli', 'apr4cli', 'apa4cli', 'btrcli', 'cfecli', 'copcli', 'mdfcli', 'apdcli', 'peccli', 'mdacli', 'trecli', 'cvicli',
         'favcli', 'fcbcli', 'itgcli', 'fefcli', 'atvcli', 'deccli', 'sdccli', 'crocli', 'nmccli', 'onacli', 'fbacli', 'halcli', 'ualcli', 'humcli', 'uumcli'

    ],
    f_age: [
      'codage','temage','zonage','impage','comage','tcoage','ivaage','irpage','pirage','falart','falage','faxage','emaage','webage','paiage','pcoage','tepage','claage',
      'dniage','rutage','cuwage','cawage','suwage','mewage','cpoage','proage','entage','ofiage','dcoage','cueage','banage','lisage','conage','domage','nomage','nocage','memage',
      'obsage','forage','lfoage','ffoage','ofoage','ureage','curage','urlage','catage','fccage','ffcage','punage','cveage','creage','purage','jeqage','csaage','agjage','dmwage','fotage','pobage','ctpage'
    ],
    f_tar: ['codtar','destar','martar','ivatar','diitar'],
    f_lta: ['tarlta','artlta','marlta','prelta'],
    f_des: ['tipdes','arfdes','desdes','fijdes','pordes','tdedes','impdes','tfides'],
    f_fac: [
      'tipfac','codfac','reffac','fecfac','estfac','almfac','agefac','profac','clifac','cnofac',
      'cdofac','cpofac','ccpfac','cprfac','cnifac','tivfac','reqfac','telfac','net1fac','net2fac',
      'net3fac','pdto1fac','pdto2fac','pdto3fac','idto1fac','idto2fac','idto3fac','pppa1fac','pppa2fac','pppa3fac',
      'ippa1fac','ippa2fac','ippa3fac','ppor1fac','ppor2fac','ppor3fac','ipor1fac','ipor2fac','ipor3fac','pfin1fac',
      'pfin2fac','pfin3fac','ifin1fac','ifin2fac','ifin3fac','bas1fac','bas2fac','bas3fac','piva1fac','piva2fac',
      'piva3fac','iiva1fac','iiva2fac','iiva3fac','prec1fac','prec2fac','prec3fac','irec1fac','irec2fac','irec3fac',
      'pret1fac','iret1fac','totfac','fopfac','prtfac','tpofac','ob1fac','ob2fac','tdrfac','cdrfac',
      'obrfac','repfac','embfac','aatfac','reafac','pedfac','fpefac','cobfac','crefac','tirfac',
      'corfac','copfac','trafac','venfac','prifac','asofac','impfac','cbafac','horfac','comfac',
      'usufac','usmfac','faxfac','imgfac','efefac','camfac','trnfac','cisfac','trcfac','net4fac',
      'pdto4fac','idto4fac','pppa4fac','ippa4fac','ppor4fac','ipor4fac','pfin4fac','ifin4fac','bas4fac','emafac',
      'pasfac','tpdfac','tidfac','a1kfac','cemfac','cpafac','bnofac','benfac','boffac','bdcfac',
      'bnufac','tiva1fac','tiva2fac','tiva3fac','rccfac','bibfac','bicfac','efsfac','efvfac','ciefac',
      'gfefac','tiffac','tpvidfac','terfac','tfifac','tfafac','trefac','cvifac','depfac','frofac',
      'nasfac','edrfac','demfac','fumfac','itbfac','stbfac','decfac','sdcfac','trzfac','eerfac',
      'trvfac','tovfac','tvefac','btffac','bcffac','bcofac','bcefac','bnefac','bcsfac','btdfac',
      'brtfac','whafac'
    ],
    f_lfa: [
      'tiplfa','codlfa','poslfa','artlfa','deslfa','canlfa','dt1lfa','dt2lfa','dt3lfa','prelfa','totlfa','ivalfa','doclfa','dtplfa','dcolfa','coslfa','bullfa','comlfa','memlfa','ejelfa','altlfa','anclfa','fonlfa','ffalfa','fcolfa','iinlfa','pivlfa','tivlfa','fimlfa','ce1lfa','ce2lfa','imalfa','sumlfa','nimlfa','tcolfa','rtilfa'
    ],
    f_fpa: [
      'codfpa','desfpa','venfpa','profpa','dia1fpa','dia2fpa','dia3fpa','dia4fpa','dia5fpa','dia6fpa',
      'pro1fpa','pro2fpa','pro3fpa','pro4fpa','pro5fpa','pro6fpa','suwfpa','dewfpa','tipfpa','efefpa',
      'mesfpa','audfpa','ccofpa','cpafpa','cfefpa','remfpa','uetfpa','banfpa'
    ],
    f_alm: ['codalm','nomalm','obsalm','diralm','cpoalm','pobalm','proalm','pcoalm','telalm','faxalm','emaalm'],
    f_pcl: [
      'tippcl', 'codpcl', 'refpcl', 'fecpcl', 'agepcl',
      'propcl', 'clipcl', 'cnopcl', 'cdopcl', 'cpopcl',
      'ccppcl', 'cprpcl', 'cnipcl', 'tivpcl', 'reqpcl',
      'telpcl', 'estpcl', 'almpcl', 'net1pcl', 'net2pcl',
      'net3pcl', 'pdto1pcl', 'pdto2pcl', 'pdto3pcl', 'idto1pcl',
      'idto2pcl', 'idto3pcl', 'pppa1pcl', 'pppa2pcl', 'pppa3pcl',
      'ippa1pcl', 'ippa2pcl', 'ippa3pcl', 'ppor1pcl', 'ppor2pcl',
      'ppor3pcl', 'ipor1pcl', 'ipor2pcl', 'ipor3pcl', 'pfin1pcl',
      'pfin2pcl', 'pfin3pcl', 'ifin1pcl', 'ifin2pcl', 'ifin3pcl',
      'bas1pcl', 'bas2pcl', 'bas3pcl', 'piva1pcl', 'piva2pcl',
      'piva3pcl', 'iiva1pcl', 'iiva2pcl', 'iiva3pcl', 'prec1pcl',
      'prec2pcl', 'prec3pcl', 'irec1pcl', 'irec2pcl', 'irec3pcl',
      'pret1pcl', 'iret1pcl', 'totpcl', 'foppcl', 'penpcl', 'prtpcl', 'tpopcl',
      'ob1pcl', 'ob2pcl', 'obrpcl', 'ppopcl', 'pripcl', 'asopcl', 'compcl', 'usupcl',
      'usmpcl', 'faxpcl', 'net4pcl', 'pdto4pcl', 'idto4pcl', 'pppa4pcl', 'ippa4pcl', 'ppor4pcl',
      'ipor4pcl', 'pfin4pcl', 'ifin4pcl', 'bas4pcl', 'emapcl', 'paspcl', 'horpcl', 'cempcl', 'cpapcl',
      'incpcl', 'tiva1pcl', 'tiva2pcl', 'tiva3pcl', 'trnpcl', 'tpvidpcl', 'terpcl', 'imppcl', 'cewpcl', 'fumpcl', 'ciepcl', 'brtpcl', 'naspcl', 'smdpcl', 'whapcl'
    ],
    f_lpc: ['tiplpc','codlpc','poslpc','artlpc','deslpc','canlpc','dt1lpc','dt2lpc','dt3lpc','prelpc','totlpc','penlpc','ivalpc','doclpc','dtplpc','dcolpc','memlpc','ejelpc','altlpc','anclpc','fonlpc','ffalpc','fcolpc',
      'iinlpc','pivlpc','tivlpc','fimlpc','coslpc','bullpc','ce1lpc','ce2lpc','imalpc','sumlpc','anulpc','nimlpc','rtilpc','comlpc','tcolpc'],
    

    f_sto: ['artsto','almsto','minsto','maxsto','actsto','dissto','ubisto'],
    f_emp: [
      'codemp','nifemp','denemp','nomemp','sigemp','domemp','numemp','escemp','pisemp','prtemp',
      'pobemp','munemp','cpoemp','proemp','telemp','faxemp','ejeemp','claemp','regemp','tomemp',
      'folemp','hojemp','insemp','emaemp','webemp','movemp','ecoemp','eademp','ecbemp','agesemp',
      'agetemp','aconemp','acotemp','alabemp','atpvemp','ac1emp','ac2emp','ac3emp','fjuemp','pcoemp',
      'ejegemp','ejecemp','ejelemp','ejetemp','uvdemp','ebaemp','traemp','tveemp','tvcemp','accemp'
    ],
    f_ume: ['codume','desume','balume']
  };
  
  export default tableOrders;
  