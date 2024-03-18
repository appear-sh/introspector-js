// copied from mime-db https://github.com/jshttp/mime-db/blob/master/db.json
// and stripped only to known extensions as we don't care about anything else here and the db is quite big
export const KNOWN_EXTENSIONS = [
  "ez",
  "appinstaller",
  "aw",
  "appx",
  "appxbundle",
  "atom",
  "atomcat",
  "atomdeleted",
  "atomsvc",
  "dwd",
  "held",
  "rsat",
  "aml",
  "amlx",
  "bdoc",
  "xcs",
  "ccxml",
  "cdfx",
  "cdmia",
  "cdmic",
  "cdmid",
  "cdmio",
  "cdmiq",
  "cpl",
  "cu",
  "cwl",
  "mpd",
  "mpp",
  "davmount",
  "dbk",
  "dssc",
  "xdssc",
  "ecma",
  "emma",
  "emotionml",
  "epub",
  "exi",
  "exp",
  "fdf",
  "fdt",
  "pfr",
  "geojson",
  "gml",
  "gpx",
  "gxf",
  "gz",
  "hjson",
  "stk",
  "ink",
  "inkml",
  "ipfix",
  "its",
  "jar",
  "war",
  "ear",
  "ser",
  "class",
  "js",
  "json",
  "map",
  "json5",
  "jsonml",
  "jsonld",
  "lgr",
  "lostxml",
  "hqx",
  "cpt",
  "mads",
  "webmanifest",
  "mrc",
  "mrcx",
  "ma",
  "nb",
  "mb",
  "mathml",
  "mbox",
  "mpf",
  "mscml",
  "metalink",
  "meta4",
  "mets",
  "maei",
  "musd",
  "mods",
  "m21",
  "mp21",
  "mp4",
  "mpg4",
  "mp4s",
  "m4p",
  "msix",
  "msixbundle",
  "doc",
  "dot",
  "mxf",
  "nq",
  "nt",
  "cjs",
  "oda",
  "opf",
  "ogx",
  "omdoc",
  "onetoc",
  "onetoc2",
  "onetmp",
  "onepkg",
  "oxps",
  "relo",
  "xer",
  "pdf",
  "pgp",
  "asc",
  "sig",
  "asc",
  "prf",
  "p10",
  "p7m",
  "p7c",
  "p7s",
  "p8",
  "ac",
  "cer",
  "crl",
  "pkipath",
  "pki",
  "pls",
  "ai",
  "eps",
  "ps",
  "provx",
  "cww",
  "xsf",
  "pskcxml",
  "raml",
  "rdf",
  "owl",
  "rif",
  "rnc",
  "rl",
  "rld",
  "rs",
  "rapd",
  "sls",
  "rusd",
  "gbr",
  "mft",
  "roa",
  "rsd",
  "rss",
  "rtf",
  "sbml",
  "scq",
  "scs",
  "spq",
  "spp",
  "sdp",
  "senmlx",
  "sensmlx",
  "setpay",
  "setreg",
  "shf",
  "siv",
  "sieve",
  "smi",
  "smil",
  "rq",
  "srx",
  "sql",
  "gram",
  "grxml",
  "sru",
  "ssdl",
  "ssml",
  "swidtag",
  "tei",
  "teicorpus",
  "tfi",
  "tsd",
  "toml",
  "trig",
  "ttml",
  "ubj",
  "rsheet",
  "td",
  "1km",
  "plb",
  "psb",
  "pvb",
  "tcap",
  "pwn",
  "aso",
  "imp",
  "acu",
  "atc",
  "acutc",
  "air",
  "fcdt",
  "fxp",
  "fxpl",
  "xdp",
  "xfdf",
  "age",
  "ahead",
  "azf",
  "azs",
  "azw",
  "acc",
  "ami",
  "apk",
  "cii",
  "fti",
  "atx",
  "mpkg",
  "key",
  "m3u8",
  "numbers",
  "pages",
  "pkpass",
  "swi",
  "iota",
  "aep",
  "bmml",
  "mpm",
  "bmi",
  "rep",
  "cdxml",
  "mmd",
  "cdy",
  "csl",
  "cla",
  "rp9",
  "c4g",
  "c4d",
  "c4f",
  "c4p",
  "c4u",
  "c11amc",
  "c11amz",
  "csp",
  "cdbcmsg",
  "cmc",
  "clkx",
  "clkk",
  "clkp",
  "clkt",
  "clkw",
  "wbs",
  "pml",
  "ppd",
  "car",
  "pcurl",
  "dart",
  "rdz",
  "dbf",
  "uvf",
  "uvvf",
  "uvd",
  "uvvd",
  "uvt",
  "uvvt",
  "uvx",
  "uvvx",
  "uvz",
  "uvvz",
  "fe_launch",
  "dna",
  "mlp",
  "dpg",
  "dfac",
  "kpxx",
  "ait",
  "svc",
  "geo",
  "mag",
  "nml",
  "esf",
  "msf",
  "qam",
  "slt",
  "ssf",
  "es3",
  "et3",
  "ez2",
  "ez3",
  "fdf",
  "mseed",
  "seed",
  "dataless",
  "gph",
  "ftc",
  "fm",
  "frame",
  "maker",
  "book",
  "fnc",
  "ltf",
  "fsc",
  "oas",
  "oa2",
  "oa3",
  "fg5",
  "bh2",
  "ddd",
  "xdw",
  "xbd",
  "fzs",
  "txd",
  "ggb",
  "ggt",
  "gex",
  "gre",
  "gxt",
  "g2w",
  "g3w",
  "gmx",
  "gdoc",
  "gslides",
  "gsheet",
  "kml",
  "kmz",
  "gqf",
  "gqs",
  "gac",
  "ghf",
  "gim",
  "grv",
  "gtm",
  "tpl",
  "vcg",
  "hal",
  "zmm",
  "hbci",
  "les",
  "hpgl",
  "hpid",
  "hps",
  "jlt",
  "pcl",
  "pclxl",
  "sfd-hdstx",
  "mpy",
  "afp",
  "listafp",
  "list3820",
  "irm",
  "sc",
  "icc",
  "icm",
  "igl",
  "ivp",
  "ivu",
  "igm",
  "xpw",
  "xpx",
  "i2g",
  "qbo",
  "qfx",
  "rcprofile",
  "irp",
  "xpr",
  "fcs",
  "jam",
  "rms",
  "jisp",
  "joda",
  "ktz",
  "ktr",
  "karbon",
  "chrt",
  "kfo",
  "flw",
  "kon",
  "kpr",
  "kpt",
  "ksp",
  "kwd",
  "kwt",
  "htke",
  "kia",
  "kne",
  "knp",
  "skp",
  "skd",
  "skt",
  "skm",
  "sse",
  "lasxml",
  "lbd",
  "lbe",
  "123",
  "apr",
  "pre",
  "nsf",
  "org",
  "scm",
  "lwp",
  "portpkg",
  "mvt",
  "mcd",
  "mc1",
  "cdkey",
  "mwf",
  "mfm",
  "flo",
  "igx",
  "mif",
  "daf",
  "dis",
  "mbk",
  "mqy",
  "msl",
  "plc",
  "txf",
  "mpn",
  "mpc",
  "xul",
  "cil",
  "cab",
  "xls",
  "xlm",
  "xla",
  "xlc",
  "xlt",
  "xlw",
  "xlam",
  "xlsb",
  "xlsm",
  "xltm",
  "eot",
  "chm",
  "ims",
  "lrm",
  "thmx",
  "msg",
  "cat",
  "stl",
  "ppt",
  "pps",
  "pot",
  "ppam",
  "pptm",
  "sldm",
  "ppsm",
  "potm",
  "mpp",
  "mpt",
  "docm",
  "dotm",
  "wps",
  "wks",
  "wcm",
  "wdb",
  "wpl",
  "xps",
  "mseq",
  "mus",
  "msty",
  "taglet",
  "nlu",
  "ntf",
  "nitf",
  "nnd",
  "nns",
  "nnw",
  "ac",
  "ngdat",
  "n-gage",
  "rpst",
  "rpss",
  "edm",
  "edx",
  "ext",
  "odc",
  "otc",
  "odb",
  "odf",
  "odft",
  "odg",
  "otg",
  "odi",
  "oti",
  "odp",
  "otp",
  "ods",
  "ots",
  "odt",
  "odm",
  "ott",
  "oth",
  "xo",
  "dd2",
  "obgx",
  "oxt",
  "osm",
  "pptx",
  "sldx",
  "ppsx",
  "potx",
  "xlsx",
  "xltx",
  "docx",
  "dotx",
  "mgp",
  "dp",
  "esa",
  "pdb",
  "pqa",
  "oprc",
  "paw",
  "str",
  "ei6",
  "efif",
  "wg",
  "plf",
  "pbd",
  "box",
  "mgz",
  "qps",
  "ptid",
  "xhtm",
  "qxd",
  "qxt",
  "qwd",
  "qwt",
  "qxl",
  "qxb",
  "rar",
  "bed",
  "mxl",
  "musicxml",
  "cryptonote",
  "cod",
  "rm",
  "rmvb",
  "link66",
  "st",
  "see",
  "sema",
  "semd",
  "semf",
  "ifm",
  "itp",
  "iif",
  "ipk",
  "twd",
  "twds",
  "mmf",
  "teacher",
  "fo",
  "sdkm",
  "sdkd",
  "dxp",
  "sfs",
  "sdc",
  "sda",
  "sdd",
  "smf",
  "sdw",
  "vor",
  "sgl",
  "smzip",
  "sm",
  "wadl",
  "sxc",
  "stc",
  "sxd",
  "std",
  "sxi",
  "sti",
  "sxm",
  "sxw",
  "sxg",
  "stw",
  "sus",
  "susp",
  "svd",
  "sis",
  "sisx",
  "xsm",
  "bdm",
  "xdm",
  "ddf",
  "tao",
  "pcap",
  "cap",
  "dmp",
  "tmo",
  "tpt",
  "mxs",
  "tra",
  "ufd",
  "ufdl",
  "utz",
  "umj",
  "unityweb",
  "uoml",
  "uo",
  "vcx",
  "vsd",
  "vst",
  "vss",
  "vsw",
  "vis",
  "vsf",
  "wbxml",
  "wmlc",
  "wmlsc",
  "wtb",
  "nbp",
  "wpd",
  "wqd",
  "stf",
  "xar",
  "xfdl",
  "hvd",
  "hvs",
  "hvp",
  "osf",
  "osfpvg",
  "saf",
  "spf",
  "cmp",
  "zir",
  "zirz",
  "zaz",
  "vxml",
  "wasm",
  "wif",
  "wgt",
  "hlp",
  "wsdl",
  "wspolicy",
  "7z",
  "abw",
  "ace",
  "dmg",
  "arj",
  "aab",
  "x32",
  "u32",
  "vox",
  "aam",
  "aas",
  "bcpio",
  "bdoc",
  "torrent",
  "blb",
  "blorb",
  "bz",
  "bz2",
  "boz",
  "cbr",
  "cba",
  "cbt",
  "cbz",
  "cb7",
  "vcd",
  "cfs",
  "chat",
  "pgn",
  "crx",
  "cco",
  "nsc",
  "cpio",
  "csh",
  "deb",
  "udeb",
  "dgc",
  "dir",
  "dcr",
  "dxr",
  "cst",
  "cct",
  "cxt",
  "w3d",
  "fgd",
  "swa",
  "wad",
  "ncx",
  "dtb",
  "res",
  "dvi",
  "evy",
  "eva",
  "bdf",
  "gsf",
  "psf",
  "pcf",
  "snf",
  "pfa",
  "pfb",
  "pfm",
  "afm",
  "arc",
  "spl",
  "gca",
  "ulx",
  "gnumeric",
  "gramps",
  "gtar",
  "hdf",
  "php",
  "install",
  "iso",
  "key",
  "numbers",
  "pages",
  "jardiff",
  "jnlp",
  "kdbx",
  "latex",
  "luac",
  "lzh",
  "lha",
  "run",
  "mie",
  "prc",
  "mobi",
  "application",
  "lnk",
  "wmd",
  "wmz",
  "xbap",
  "mdb",
  "obd",
  "crd",
  "clp",
  "exe",
  "exe",
  "dll",
  "com",
  "bat",
  "msi",
  "mvb",
  "m13",
  "m14",
  "wmf",
  "wmz",
  "emf",
  "emz",
  "mny",
  "pub",
  "scd",
  "trm",
  "wri",
  "nc",
  "cdf",
  "pac",
  "nzb",
  "pl",
  "pm",
  "prc",
  "pdb",
  "p12",
  "pfx",
  "p7b",
  "spc",
  "p7r",
  "rar",
  "rpm",
  "ris",
  "sea",
  "sh",
  "shar",
  "swf",
  "xap",
  "sql",
  "sit",
  "sitx",
  "srt",
  "sv4cpio",
  "sv4crc",
  "t3",
  "gam",
  "tar",
  "tcl",
  "tk",
  "tex",
  "tfm",
  "texinfo",
  "texi",
  "obj",
  "ustar",
  "hdd",
  "ova",
  "ovf",
  "vbox",
  "vbox-extpack",
  "vdi",
  "vhd",
  "vmdk",
  "src",
  "webapp",
  "der",
  "crt",
  "pem",
  "fig",
  "xlf",
  "xpi",
  "xz",
  "z1",
  "z2",
  "z3",
  "z4",
  "z5",
  "z6",
  "z7",
  "z8",
  "xaml",
  "xav",
  "xca",
  "xdf",
  "xel",
  "xns",
  "xenc",
  "xfdf",
  "xhtml",
  "xht",
  "xlf",
  "xml",
  "xsl",
  "xsd",
  "rng",
  "dtd",
  "xop",
  "xpl",
  "xsl",
  "xslt",
  "xspf",
  "mxml",
  "xhvml",
  "xvml",
  "xvm",
  "yang",
  "yin",
  "zip",
  "3gpp",
  "adts",
  "aac",
  "adp",
  "amr",
  "au",
  "snd",
  "mid",
  "midi",
  "kar",
  "rmi",
  "mxmf",
  "mp3",
  "m4a",
  "mp4a",
  "mpga",
  "mp2",
  "mp2a",
  "mp3",
  "m2a",
  "m3a",
  "oga",
  "ogg",
  "spx",
  "opus",
  "s3m",
  "sil",
  "uva",
  "uvva",
  "eol",
  "dra",
  "dts",
  "dtshd",
  "lvp",
  "pya",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "rip",
  "wav",
  "wav",
  "weba",
  "aac",
  "aif",
  "aiff",
  "aifc",
  "caf",
  "flac",
  "m4a",
  "mka",
  "m3u",
  "wax",
  "wma",
  "ram",
  "ra",
  "rmp",
  "ra",
  "wav",
  "xm",
  "cdx",
  "cif",
  "cmdf",
  "cml",
  "csml",
  "xyz",
  "ttc",
  "otf",
  "ttf",
  "woff",
  "woff2",
  "exr",
  "apng",
  "avci",
  "avcs",
  "avif",
  "bmp",
  "dib",
  "cgm",
  "drle",
  "dpx",
  "emf",
  "fits",
  "g3",
  "gif",
  "heic",
  "heics",
  "heif",
  "heifs",
  "hej2",
  "hsj2",
  "ief",
  "jls",
  "jp2",
  "jpg2",
  "jpeg",
  "jpg",
  "jpe",
  "jph",
  "jhc",
  "jpm",
  "jpgm",
  "jpx",
  "jpf",
  "jxr",
  "jxra",
  "jxrs",
  "jxs",
  "jxsc",
  "jxsi",
  "jxss",
  "ktx",
  "ktx2",
  "png",
  "btif",
  "btf",
  "pti",
  "sgi",
  "svg",
  "svgz",
  "t38",
  "tif",
  "tiff",
  "tfx",
  "psd",
  "azv",
  "uvi",
  "uvvi",
  "uvg",
  "uvvg",
  "djvu",
  "djv",
  "sub",
  "dwg",
  "dxf",
  "fbs",
  "fpx",
  "fst",
  "mmr",
  "rlc",
  "ico",
  "dds",
  "mdi",
  "wdp",
  "npx",
  "b16",
  "tap",
  "vtf",
  "wbmp",
  "xif",
  "pcx",
  "webp",
  "wmf",
  "3ds",
  "ras",
  "cmx",
  "fh",
  "fhc",
  "fh4",
  "fh5",
  "fh7",
  "ico",
  "jng",
  "sid",
  "bmp",
  "pcx",
  "pic",
  "pct",
  "pnm",
  "pbm",
  "pgm",
  "ppm",
  "rgb",
  "tga",
  "xbm",
  "xpm",
  "xwd",
  "disposition-notification",
  "u8msg",
  "u8dsn",
  "u8mdn",
  "u8hdr",
  "eml",
  "mime",
  "wsc",
  "3mf",
  "gltf",
  "glb",
  "igs",
  "iges",
  "jt",
  "msh",
  "mesh",
  "silo",
  "mtl",
  "obj",
  "prc",
  "stpx",
  "stpz",
  "stpxz",
  "stl",
  "u3d",
  "cld",
  "dae",
  "dwf",
  "gdl",
  "gtw",
  "mts",
  "ogex",
  "x_b",
  "x_t",
  "pyo",
  "pyox",
  "vds",
  "usda",
  "usdz",
  "bsp",
  "vtu",
  "wrl",
  "vrml",
  "x3db",
  "x3dbz",
  "x3db",
  "x3dv",
  "x3dvz",
  "x3d",
  "x3dz",
  "x3dv",
  "appcache",
  "manifest",
  "ics",
  "ifb",
  "coffee",
  "litcoffee",
  "css",
  "csv",
  "html",
  "htm",
  "shtml",
  "jade",
  "js",
  "mjs",
  "jsx",
  "less",
  "md",
  "markdown",
  "mml",
  "mdx",
  "n3",
  "txt",
  "text",
  "conf",
  "def",
  "list",
  "log",
  "in",
  "ini",
  "dsc",
  "rtx",
  "rtf",
  "sgml",
  "sgm",
  "shex",
  "slim",
  "slm",
  "spdx",
  "stylus",
  "styl",
  "tsv",
  "t",
  "tr",
  "roff",
  "man",
  "me",
  "ms",
  "ttl",
  "uri",
  "uris",
  "urls",
  "vcard",
  "curl",
  "dcurl",
  "mcurl",
  "scurl",
  "sub",
  "ged",
  "fly",
  "flx",
  "gv",
  "3dml",
  "spot",
  "jad",
  "wml",
  "wmls",
  "vtt",
  "wgsl",
  "s",
  "asm",
  "c",
  "cc",
  "cxx",
  "cpp",
  "h",
  "hh",
  "dic",
  "htc",
  "f",
  "for",
  "f77",
  "f90",
  "hbs",
  "java",
  "lua",
  "mkd",
  "nfo",
  "opml",
  "org",
  "p",
  "pas",
  "pde",
  "sass",
  "scss",
  "etx",
  "sfv",
  "ymp",
  "uu",
  "vcs",
  "vcf",
  "xml",
  "yaml",
  "yml",
  "3gp",
  "3gpp",
  "3g2",
  "h261",
  "h263",
  "h264",
  "m4s",
  "jpgv",
  "jpm",
  "jpgm",
  "mj2",
  "mjp2",
  "ts",
  "mp4",
  "mp4v",
  "mpg4",
  "mpeg",
  "mpg",
  "mpe",
  "m1v",
  "m2v",
  "ogv",
  "qt",
  "mov",
  "uvh",
  "uvvh",
  "uvm",
  "uvvm",
  "uvp",
  "uvvp",
  "uvs",
  "uvvs",
  "uvv",
  "uvvv",
  "dvb",
  "fvt",
  "mxu",
  "m4u",
  "pyv",
  "uvu",
  "uvvu",
  "viv",
  "webm",
  "f4v",
  "fli",
  "flv",
  "m4v",
  "mkv",
  "mk3d",
  "mks",
  "mng",
  "asf",
  "asx",
  "vob",
  "wm",
  "wmv",
  "wmx",
  "wvx",
  "avi",
  "movie",
  "smv",
  "ice",
]
