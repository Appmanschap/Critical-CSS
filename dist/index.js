import{URL as v}from"url";import*as e from"@actions/core";import r from"@actions/core";import m from"fs";import{resolve as P}from"path";import{Launcher as y}from"chrome-launcher";function l(){let t=r.getInput("serverBaseUrl");t||(r.setFailed("Need a valid base url."),process.exit(1)),t.substr(-1)!=="/"&&(t+="/");let s=r.getInput("destinationPath");s||(r.setFailed("Need a valid destination path."),process.exit(1));let o=r.getInput("configPath")?P(r.getInput("configPath")):null;o||(r.setFailed("Config file not found or invalid configPath."),process.exit(1));let n=JSON.parse(m.readFileSync(o));n.length||(r.setFailed("Invalid config."),process.exit(1));let i=y.getFirstInstallation(),a=r.getInput("sync"),c={};if(a){let d=r.getInput("sshPrivateKeyPath"),h=r.getInput("sshHost"),u=r.getInput("sshPort"),p=r.getInput("targetDir");(!h||!p)&&(r.setFailed("Invalid ssh options provided."),process.exit(1)),c={sshPrivateKeyPath:d,sshHost:h,sshPort:u,targetDir:p}}return{baseUrl:t,destinationPath:s,paths:n,browserPath:i,shouldSync:a,syncOptions:c}}import{generate as I}from"critical";import f from"rsyncwrapper";import S from"fs";import*as g from"chrome-launcher";var w=async t=>{e.startGroup("Clean up"),S.mkdirSync(t.src),f(t,(s,o,n,i)=>{s?(e.error(s),e.error(o),e.error(n),e.error(i),process.exit(1)):(e.info("Rsync cleanup finished"),e.info(o))}),e.endGroup()},C=async t=>{for(let s of t.paths){console.log(s);let o=new v(`${t.baseUrl}${s.url}`),n=t.destinationPath+s.template+"_critical.min.css";e.info(`Generating critical CSS: ${o.href} -> ${n}`);async function i(){return g.launch({chromeFlags:["--headless=new"]})}await I({src:o.href,target:n,inline:!1,penthouse:{chromeFlags:{}},ignore:[],dimensions:[{width:375,height:667},{width:1440,height:1280}]})}},F=async()=>{e.startGroup("Action config");let t=l();process.env.PUPPETEER_EXECUTABLE_PATH=t.browserPath;let s={src:t.destinationPath,dest:`${t.syncOptions.sshHost}:${t.syncOptions.targetDir}`,args:["-azhcvv"],delete:!0,ssh:!0,port:t.syncOptions.sshPort};t.syncOptions.sshPrivateKeyPath.length&&(s.privateKey=t.syncOptions.sshPrivateKeyPath),e.endGroup(),await w(s),e.startGroup("Start Critical CSS"),await C(t),e.endGroup(),t.shouldSync&&(e.startGroup(`Starting Rsync ${t.destinationPath} -> ${t.syncOptions.targetDir}`),f(s,(o,n,i,a)=>{o?(e.error(o),e.error(n),e.error(i),e.error(a),process.exit(1)):(e.info("Rsync finished"),e.info(n))}),e.endGroup())};F().catch(t=>{e.setFailed(t.message),process.exit(1)}).then(()=>e.debug(`done in ${process.uptime()}s`));
//# sourceMappingURL=index.js.map