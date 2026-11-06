    const CSS = `
.sr-app{
  width:100%;
  max-width:100%;
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  background:var(--dsw-alias-bg-base);
  color:var(--dsw-alias-label-primary);
  font-family:${UI_FONT};
  font-size:14px;
  line-height:1.55;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  box-sizing:border-box;
  /* The host brand flips between near-black and near-white, so the plugin keeps its own pine accent
     for solid fills (buttons, progress) where a white block would look broken. */
  --sr-accent-strong:#3f7d6b;
}
/* DeepSeek Harness host layout integration: collapse empty rightbar & harmonize background */
.PIRFFq_frame:has(.sr-reader),
[class*="_frame"]:has(.sr-reader){
  grid-template-columns:minmax(0,auto) minmax(0,1fr) 0px !important;
}
.PIRFFq_centerCol:has(.sr-reader) ~ .PIRFFq_rightbarCol,
.PIRFFq_frame:has(.sr-reader) .PIRFFq_rightbarCol,
[class*="_centerCol"]:has(.sr-reader) ~ [class*="_rightbarCol"],
[class*="_centerCol"]:has(.sr-reader) ~ [data-rightbar-col],
[class*="_frame"]:has(.sr-reader) [class*="_rightbarCol"],
[class*="_frame"]:has(.sr-reader) [data-rightbar-col],
:root:has(.sr-reader) [data-rightbar-col],
body:has(.sr-reader) [data-rightbar-col]{
  display:none !important;
  width:0 !important;
  min-width:0 !important;
  max-width:0 !important;
  flex:0 0 0px !important;
  padding:0 !important;
  margin:0 !important;
  border:none !important;
  pointer-events:none !important;
  visibility:hidden !important;
}
.PIRFFq_frame:has(.sr-reader) .PIRFFq_handle[data-side="rightbar"],
[class*="_frame"]:has(.sr-reader) [data-side="rightbar"]{
  display:none !important;
  pointer-events:none !important;
}
.PIRFFq_frame:has(.sr-reader),
[class*="_frame"]:has(.sr-reader),
[data-platform=darwin] .PIRFFq_centerCol:has(.sr-reader),
[data-platform=darwin] [class*="_centerCol"]:has(.sr-reader),
.PIRFFq_centerCol:has(.sr-reader),
[class*="_centerCol"]:has(.sr-reader),
.PIRFFq_mainPanel:has(.sr-reader),
[class*="_mainPanel"]:has(.sr-reader),
.sr-app:has(.sr-reader){
  background:var(--sr-bg,#f3ede2) !important;
  width:100% !important;
  height:100% !important;
  min-width:100% !important;
  max-width:100% !important;
  border-left:none !important;
  box-sizing:border-box !important;
}
.sr-app:has(.sr-reader[data-theme="paper"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="paper"]), [class*="_centerCol"]:has(.sr-reader[data-theme="paper"]){ background:#f3ede2 !important; }
.sr-app:has(.sr-reader[data-theme="candle"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="candle"]), [class*="_centerCol"]:has(.sr-reader[data-theme="candle"]){ background:#f4e6ce !important; }
.sr-app:has(.sr-reader[data-theme="snow"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="snow"]), [class*="_centerCol"]:has(.sr-reader[data-theme="snow"]){ background:#f8f7f4 !important; }
.sr-app:has(.sr-reader[data-theme="mint"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="mint"]), [class*="_centerCol"]:has(.sr-reader[data-theme="mint"]){ background:#e6eee4 !important; }
.sr-app:has(.sr-reader[data-theme="forest"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="forest"]), [class*="_centerCol"]:has(.sr-reader[data-theme="forest"]){ background:#121c18 !important; }
.sr-app:has(.sr-reader[data-theme="night"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="night"]), [class*="_centerCol"]:has(.sr-reader[data-theme="night"]){ background:#151a1d !important; }
.sr-app:has(.sr-reader[data-theme="oled"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="oled"]), [class*="_centerCol"]:has(.sr-reader[data-theme="oled"]){ background:#000000 !important; }
.sr-app:has(.sr-reader[data-theme="eink"]), .PIRFFq_centerCol:has(.sr-reader[data-theme="eink"]), [class*="_centerCol"]:has(.sr-reader[data-theme="eink"]){ background:#ffffff !important; }
.sr-app *,.sr-app *::before,.sr-app *::after{box-sizing:border-box;}
/* :where() keeps these resets at zero specificity so component rules (color, font-size) still win. */
.sr-app :where(button,input,textarea){font:inherit;}
.sr-app :where(button){color:inherit;background:none;border:0;}
.sr-app :where(button,input,textarea):focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.sr-app ::selection{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 26%,transparent);}
.sr-topspace{display:none;}
.sr-shell{flex:1;min-height:0;display:flex;flex-direction:column;}
.sr-header{
  flex:none;
  position:relative;
  z-index:8;
  border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 72%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-base) 88%,transparent);
  backdrop-filter:blur(16px) saturate(1.1);
  -webkit-backdrop-filter:blur(16px) saturate(1.1);
  -webkit-app-region:drag;
}
.sr-header :where(button,input,a,textarea,[tabindex],.sr-brand-import-pill,.sr-tabs,.sr-import-progress,.sr-nav){
  -webkit-app-region:no-drag;
}
.sr-header-inner{
  width:100%;
  max-width:1240px;
  margin:0 auto;
  height:58px;
  padding:0 clamp(20px,3vw,36px);
  display:flex;
  align-items:center;
  gap:24px;
}
.sr-brand{display:flex;align-items:center;gap:11px;width:170px;min-width:170px;max-width:170px;flex:0 0 170px;position:relative;}
.sr-brand-mark{
  width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:11px;background:linear-gradient(145deg,#2e5d51,#152f2b);
  box-shadow:0 1px 1px rgba(0,0,0,.18),0 7px 18px -12px rgba(15,60,51,.7),inset 0 1px 0 rgba(255,255,255,.14);
  color:#f3e7cf;position:relative;overflow:hidden;
}
.sr-brand-mark::after{
  content:"";position:absolute;width:19px;height:19px;border-radius:50%;
  right:-4px;top:-5px;background:radial-gradient(circle,#f1c277,#d79b44 58%,transparent 62%);
  opacity:.85;
}
.sr-brand-mark svg{position:relative;z-index:1;}
.sr-brand-text{display:flex;flex-direction:column;gap:1px;min-width:0;}
.sr-brand-title{margin:0;font-size:16px;line-height:1.25;font-weight:650;letter-spacing:.03em;white-space:nowrap;}
.sr-brand-sub{font-size:10.5px;line-height:1.35;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;white-space:nowrap;}
.sr-brand-import-wrap{position:relative;display:contents;}
.sr-brand-import-pill{
  position:relative;overflow:hidden;
  display:inline-flex;align-items:center;gap:4px;margin-top:2px;padding:1px 7px 2px;
  border-radius:999px;border:1px solid color-mix(in oklab,var(--dsw-alias-brand-primary) 36%,var(--dsw-alias-border-l1));
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-overlay));
  color:var(--dsw-alias-brand-primary);font-size:10px;font-weight:600;line-height:1.25;
  cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  box-shadow:0 1px 4px color-mix(in oklab,var(--dsw-alias-brand-primary) 18%,transparent);
  transition:all .15s ease;animation:sr-fade .18s ease;white-space:nowrap;max-width:fit-content;
}
.sr-brand-import-pill:hover,.sr-brand-import-pill--active{
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 22%,var(--dsw-alias-bg-overlay));
  border-color:var(--dsw-alias-brand-primary);
  box-shadow:0 2px 8px color-mix(in oklab,var(--dsw-alias-brand-primary) 28%,transparent);
}
.sr-brand-import-pill svg{flex:none;}
.sr-brand-import-label{font-size:10px;font-weight:600;}
.sr-brand-import-count{font-variant-numeric:tabular-nums;letter-spacing:.02em;}
.sr-brand-import-pct{font-size:9.5px;opacity:.78;font-variant-numeric:tabular-nums;}
.sr-brand-import-bar{
  position:absolute;left:0;bottom:0;height:1.5px;
  background:var(--dsw-alias-brand-primary);
  transition:width .18s ease;
}
.sr-nav{
  display:flex;align-items:center;gap:2px;padding:3px;flex:none;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);
  border-radius:10px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 72%,transparent);
}
.sr-nav-item{
  appearance:none;border:0;background:transparent;height:29px;padding:0 14px;border-radius:7px;
  color:var(--dsw-alias-label-secondary);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;
  transition:color .15s ease,background .15s ease,box-shadow .15s ease;
}
.sr-nav-item:hover{color:var(--dsw-alias-label-primary);}
.sr-nav-item[aria-selected="true"]{
  color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);
  box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 1px color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);
}
.sr-nav-count{font-size:10px;opacity:.55;margin-left:4px;font-variant-numeric:tabular-nums;}
.sr-header-actions{margin-left:auto;display:flex;align-items:center;gap:9px;min-width:0;}
.sr-mobile-search{display:none;}
.sr-search{position:relative;display:flex;align-items:center;flex:none;}
.sr-search svg{position:absolute;left:10px;color:var(--dsw-alias-label-secondary);pointer-events:none;opacity:.8;}
.sr-search input{
  appearance:none;width:192px;height:33px;padding:0 11px 0 31px;border-radius:9px;
  border:1px solid var(--dsw-alias-border-l1);background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 80%,transparent);
  color:var(--dsw-alias-label-primary);font-size:12.5px;outline:none;
  transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;
}
.sr-search input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.82;}
.sr-search input:focus{
  border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);
  box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 15%,transparent);
}
.sr-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:33px;padding:0 13px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);
  background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);
  font-size:12.5px;font-weight:550;white-space:nowrap;cursor:pointer;
  transition:background .15s ease,border-color .15s ease,transform .06s ease,filter .15s ease;
}
.sr-btn:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2);}
.sr-btn:active{transform:translateY(1px);}
.sr-btn-primary{
  border-color:transparent;
  background:linear-gradient(180deg,#3a6f60,#26483f);
  color:#f7f1e2;
  box-shadow:0 1px 2px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.16);
}
.sr-btn-primary:hover{background:linear-gradient(180deg,#417e6c,#2d564a);border-color:transparent;filter:none;}
.sr-btn-primary:active{background:#24443b;}
.sr-btn:disabled{opacity:.42;cursor:default;filter:none;transform:none;}
.sr-wishlist-btn[data-on="true"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 32%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);}
.sr-shelve-btn[data-on="true"]{color:var(--dsw-alias-label-primary);border-color:color-mix(in oklab,var(--dsw-alias-label-primary) 28%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-label-primary) 8%,transparent);}
.sr-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 35%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 8%,var(--dsw-alias-bg-layer-1));}
.sr-btn-danger:hover{background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 13%,var(--dsw-alias-bg-layer-1));border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 48%,var(--dsw-alias-border-l1));}
.sr-btn-ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary);}
.sr-btn-ghost:hover{color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);}
.sr-btn-sm{height:29px;padding:0 10px;font-size:12px;border-radius:8px;}
.sr-icon-btn{
  display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;
  border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);
  cursor:pointer;transition:background .14s ease,color .14s ease;
}
.sr-icon-btn:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary);}
.sr-icon-btn[data-danger="true"]:hover{background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);}
.sr-icon-btn[data-on="true"]{color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);}
.sr-scroll{
  flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable;
  overscroll-behavior:contain;
  scrollbar-width:thin;scrollbar-color:color-mix(in oklab,var(--dsw-alias-label-secondary) 26%,transparent) transparent;
}
.sr-scroll::-webkit-scrollbar{width:10px;}
.sr-scroll::-webkit-scrollbar-thumb{background:color-mix(in oklab,var(--dsw-alias-label-secondary) 24%,transparent);border:3px solid transparent;background-clip:padding-box;border-radius:10px;}
.sr-content{width:100%;max-width:1240px;margin:0 auto;padding:20px clamp(20px,3vw,36px) 56px;}
.sr-greeting-line{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:15px;}
.sr-greeting-line h1{margin:0;font-size:14px;font-weight:500;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;}
.sr-greeting-line span{font-size:11.5px;color:var(--dsw-alias-label-secondary);opacity:.72;font-variant-numeric:tabular-nums;}
.sr-hero-grid{display:grid;grid-template-columns:minmax(0,1.72fr) minmax(255px,.72fr);gap:16px;margin-bottom:32px;}
.sr-hero-main{
  position:relative;isolation:isolate;overflow:hidden;min-height:276px;
  display:grid;grid-template-columns:minmax(0,1fr) 296px;gap:26px;align-items:center;
  padding:31px 32px;border-radius:19px;color:#f5eddd;
  background:
    radial-gradient(90% 150% at 92% 2%,rgba(213,177,112,.2),transparent 54%),
    radial-gradient(80% 120% at 0% 100%,rgba(75,124,110,.32),transparent 61%),
    linear-gradient(118deg,#152a27 0%,#203e37 48%,#344c3d 100%);
  box-shadow:0 2px 4px rgba(0,0,0,.08),0 22px 38px -30px rgba(8,38,31,.8),inset 0 1px 0 rgba(255,255,255,.08);
}
.sr-hero-main::before{
  content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;
  background-image:
    radial-gradient(circle at 78% 25%,rgba(245,231,205,.5) 0 1px,transparent 1.6px),
    radial-gradient(circle at 67% 64%,rgba(245,231,205,.3) 0 1px,transparent 1.4px),
    radial-gradient(circle at 88% 72%,rgba(245,231,205,.35) 0 1px,transparent 1.5px);
  background-size:170px 140px,210px 170px,250px 190px;
  opacity:.55;
}
.sr-hero-main::after{
  content:"";position:absolute;z-index:-1;width:310px;height:310px;right:-115px;bottom:-160px;border-radius:50%;
  border:1px solid rgba(244,232,211,.14);box-shadow:0 0 0 32px rgba(244,232,211,.025),0 0 0 70px rgba(244,232,211,.02);
}
.sr-hero-copy{min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center;}
.sr-hero-kicker{
  display:inline-flex;align-items:center;gap:7px;margin-bottom:14px;
  font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#c9bc9f;
}
.sr-hero-kicker::before{content:"";width:16px;height:1px;background:#b8a77f;opacity:.8;}
.sr-hero-title{
  margin:0;font-family:${SERIF_FONT};font-size:clamp(22px,2.4vw,31px);line-height:1.42;
  font-weight:600;letter-spacing:.07em;color:#f7f0e2;text-wrap:balance;
}
.sr-hero-title span{display:block;color:#e9d6ae;}
.sr-hero-copy p{margin:13px 0 0;max-width:330px;font-size:12.5px;line-height:1.75;color:#bdb7a7;}
.sr-hero-tip{display:flex;align-items:center;gap:7px;margin-top:19px;font-size:11px;color:#a7ac9d;letter-spacing:.02em;}
.sr-hero-tip svg{opacity:.65;}
.sr-continue-card{
  appearance:none;position:relative;display:flex;align-items:center;gap:15px;width:100%;padding:13px;text-align:left;font:inherit;color:inherit;cursor:pointer;
  border-radius:14px;border:1px solid rgba(241,232,211,.16);
  background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.045));
  box-shadow:0 12px 28px -22px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08);
}
.sr-continue-card:hover{border-color:rgba(241,232,211,.27);background:linear-gradient(145deg,rgba(255,255,255,.15),rgba(255,255,255,.06));}
.sr-continue-card:focus-visible{outline:2px solid #e9d6ae;outline-offset:2px;}
.sr-continue-card .sr-cover{width:72px;flex:0 0 72px;box-shadow:0 9px 19px -12px rgba(0,0,0,.75);}
.sr-continue-card .sr-cover-title{display:none;}
.sr-continue-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px;}
.sr-continue-label{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:#b8b49f;font-weight:600;}
.sr-continue-title{font-family:${SERIF_FONT};font-size:17px;line-height:1.35;font-weight:600;color:#f8f0df;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sr-continue-meta{font-size:10.5px;color:#b9b7a7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sr-continue-progress{margin-top:8px;display:flex;align-items:center;gap:8px;}
.sr-continue-track{height:3px;flex:1;border-radius:3px;background:rgba(239,230,211,.16);overflow:hidden;}
.sr-continue-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#d6b77c,#f1d9aa);}
.sr-continue-pct{font-size:9.5px;color:#cfc6b3;font-variant-numeric:tabular-nums;min-width:27px;text-align:right;}
.sr-continue-go{
  width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;
  border:0;border-radius:50%;background:#f1e6ce;color:#1c352f;cursor:pointer;
  box-shadow:0 3px 9px rgba(0,0,0,.18);transition:transform .16s ease,background .16s ease;
}
.sr-continue-go:hover{transform:translateX(2px);background:#fff6e4;}
.sr-goal-card{
  display:flex;flex-direction:column;justify-content:space-between;min-height:276px;
  padding:22px 22px 19px;border-radius:19px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);
  background:
    radial-gradient(100% 100% at 100% 0%,color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent),transparent 62%),
    var(--dsw-alias-bg-layer-1);
}
.sr-goal-top{display:flex;align-items:center;gap:15px;}
.sr-ring{width:67px;height:67px;flex:none;transform:rotate(-90deg);}
.sr-ring circle{fill:none;stroke-width:5;}
.sr-ring .sr-ring-track{stroke:color-mix(in oklab,var(--dsw-alias-border-l1) 90%,transparent);}
.sr-ring .sr-ring-fill{
  stroke:var(--sr-accent-strong);stroke-linecap:round;
  filter:drop-shadow(0 2px 4px color-mix(in oklab,var(--sr-accent-strong) 35%,transparent));
  transition:stroke-dashoffset .6s cubic-bezier(.16,1,.3,1);
}
.sr-ring-wrap{position:relative;width:67px;height:67px;flex:none;display:flex;align-items:center;justify-content:center;}
.sr-ring-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);}
.sr-goal-kicker{font-size:9.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.sr-goal-time{margin-top:4px;font-size:22px;line-height:1.2;font-weight:620;font-variant-numeric:tabular-nums;letter-spacing:-.015em;}
.sr-goal-time small{font-size:11.5px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-left:3px;}
.sr-goal-streak{margin-top:8px;display:flex;align-items:center;gap:5px;font-size:11px;color:var(--dsw-alias-label-secondary);}
.sr-goal-streak strong{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums;}
.sr-goal-quote{
  margin-top:17px;padding-top:15px;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  font-family:${SERIF_FONT};font-size:12.5px;line-height:1.72;color:var(--dsw-alias-label-secondary);
}
.sr-goal-quote p{margin:0;}
.sr-daily-quote{display:block;width:100%;padding:15px 0 0;border:0;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);background:transparent;text-align:left;color:inherit;cursor:pointer;font:inherit;}
.sr-daily-quote:hover{color:var(--dsw-alias-label-primary);}
.sr-daily-kicker{display:block;margin:0 0 4px;font-family:var(--dsw-font-sans);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-brand-primary);opacity:.8;}
.sr-daily-wrap{margin-top:17px;padding-top:15px;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);}
.sr-daily-wrap .sr-daily-quote{margin-top:0;padding-top:0;border-top:0;}
.sr-daily-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:1px;flex-wrap:wrap;row-gap:4px;}
.sr-daily-action{display:inline-flex;align-items:center;gap:3px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:8.5px;cursor:pointer;opacity:.7;white-space:nowrap;}
.sr-daily-action:hover{color:var(--dsw-alias-brand-primary);opacity:1;}
.sr-daily-quote p{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;}
.sr-daily-quote span:last-child{display:block;margin-top:6px;font-family:var(--dsw-font-sans);font-size:9.5px;letter-spacing:.03em;opacity:.72;}
.sr-goal-quote span{display:block;margin-top:6px;font-family:${UI_FONT};font-size:10px;letter-spacing:.04em;opacity:.72;}
.sr-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 16px;}
.sr-section-head h2{margin:0;font-family:${SERIF_FONT};font-size:20px;line-height:1.3;font-weight:600;letter-spacing:.04em;}
.sr-section-head p{margin:4px 0 0;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.sr-count-chip{
  display:inline-flex;align-items:center;height:23px;padding:0 9px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l1);background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 78%,transparent);
  color:var(--dsw-alias-label-secondary);font-size:10.5px;font-variant-numeric:tabular-nums;white-space:nowrap;
}
.sr-filter-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 18px;}
.sr-chip{
  display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);
  font-size:11.5px;cursor:pointer;white-space:nowrap;transition:background .14s ease,color .14s ease,border-color .14s ease;
}
.sr-chip:hover{color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-chip[aria-pressed="true"]{
  color:var(--dsw-alias-label-primary);border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 37%,var(--dsw-alias-border-l1));
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 10%,transparent);
}
.sr-chip-count{opacity:.55;font-variant-numeric:tabular-nums;font-size:10px;}
.sr-tag-filter-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:-6px 0 17px;}
.sr-filter-label,.sr-tag-filter-row>.sr-tag-filter-label{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);opacity:.7;margin-right:2px;}
.sr-tag-chip{
  appearance:none;display:inline-flex;align-items:center;gap:2px;height:24px;padding:0 9px;
  border-radius:999px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 86%,transparent);
  background:transparent;color:var(--dsw-alias-label-secondary);font-size:10px;cursor:pointer;
  transition:all .14s cubic-bezier(.16,1,.3,1);
}
.sr-tag-chip:hover{
  color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);
  transform:translateY(-1px);box-shadow:0 2px 6px -1px rgba(0,0,0,.08);
}
.sr-tag-chip[aria-pressed="true"]{
  color:#f6f1e4;border-color:#4c8a75;background:#3f7d6b;font-weight:600;
  box-shadow:0 2px 8px -2px rgba(63,125,107,.55),inset 0 1px 0 rgba(255,255,255,.16);
}
.sr-tag-hash{opacity:.5;font-size:10px;}
.sr-user-tag-editor{margin:0 0 15px;}
.sr-user-tag-editor .sr-detail-section-label{margin-bottom:6px;}
.sr-user-tag-list{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:7px;min-height:20px;}
.sr-user-tag{display:inline-flex;align-items:center;gap:3px;height:22px;padding:0 4px 0 8px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);border:1px solid color-mix(in oklab,var(--dsw-alias-brand-primary) 18%,var(--dsw-alias-border-l1));color:var(--dsw-alias-label-primary);font-size:9.5px;}
.sr-user-tag-remove{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-user-tag-remove:hover{color:var(--dsw-alias-state-error-primary);background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 10%,transparent);}
.sr-user-tag-empty{font-size:9.5px;color:var(--dsw-alias-label-secondary);opacity:.72;font-style:italic;}
.sr-tag-add{display:flex;align-items:center;gap:5px;}
.sr-tag-add input{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 45%,transparent);color:var(--dsw-alias-label-primary);font-size:10.5px;outline:none;}
.sr-tag-add input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 11%,transparent);}
.sr-tag-add-btn{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:10px;cursor:pointer;white-space:nowrap;}
.sr-tag-add-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);}
.sr-tag-add-btn:disabled{opacity:.4;cursor:default;}
.sr-content-results{margin:0 0 18px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 78%,transparent);border-radius:11px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 68%,transparent);overflow:hidden;}
.sr-content-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 58%,transparent);font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.sr-content-head span:last-child{font-weight:400;letter-spacing:.01em;text-transform:none;font-size:9px;opacity:.75;}
.sr-content-result{appearance:none;display:flex;align-items:flex-start;gap:10px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 46%,transparent);background:transparent;color:inherit;text-align:left;cursor:pointer;transition:background .14s ease;}
.sr-content-result:last-child{border-bottom:0;}
.sr-content-result:hover{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 5%,transparent);}
.sr-content-result:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.sr-content-result-body{min-width:0;flex:1;}
.sr-content-result-head{display:flex;align-items:center;gap:7px;min-width:0;margin-bottom:3px;}
.sr-content-result-head strong{font-family:${SERIF_FONT};font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-content-result-head span{font-size:8.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.82;}
.sr-content-result p{margin:0;font-family:${SERIF_FONT};font-size:11px;line-height:1.7;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;}
.sr-content-result mark{padding:0 1px;border-radius:2px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 20%,transparent);color:var(--dsw-alias-label-primary);box-shadow:inset 0 -1px 0 color-mix(in oklab,var(--dsw-alias-brand-primary) 55%,transparent);}
.sr-content-empty{padding:16px 12px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center;opacity:.8;}
.sr-shelf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:26px 19px;align-items:start;}
.sr-shelf-head-tools{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;}
.sr-shelf-head-tools .sr-icon-btn{width:27px;height:27px;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 70%,transparent);}
.sr-sort{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);}
.sr-sort select{height:26px;max-width:128px;padding:0 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 78%,transparent);color:var(--dsw-alias-label-primary);font:inherit;font-size:10.5px;outline:none;cursor:pointer;}
.sr-sort select:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);}
.sr-view-toggle{display:inline-flex;align-items:center;gap:1px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 70%,transparent);}
.sr-view-btn{width:24px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-view-btn:hover{color:var(--dsw-alias-label-primary);}
.sr-view-btn[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.07);}
.sr-view-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.sr-status-groups{display:flex;flex-direction:column;gap:26px;}
.sr-status-head{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding-bottom:7px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 60%,transparent);}
.sr-status-head h3{margin:0;font-family:${SERIF_FONT};font-size:15px;font-weight:600;letter-spacing:.04em;}
.sr-status-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);color:var(--dsw-alias-brand-primary);font-size:8px;font-variant-numeric:tabular-nums;}
.sr-book-list{display:flex;flex-direction:column;gap:7px;}
.sr-book-row{appearance:none;display:flex;align-items:center;gap:12px;width:100%;min-width:0;padding:9px 11px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 76%,transparent);border-radius:11px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 60%,transparent);color:inherit;font:inherit;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease;contain:layout paint style;content-visibility:auto;contain-intrinsic-size:auto 61px;}
.sr-book-row:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 8px 22px -22px rgba(0,0,0,.45);}
.sr-book-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.sr-book-row .sr-cover{flex:none;}
.sr-book-row-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px;}
.sr-book-row-title{display:flex;align-items:center;gap:5px;min-width:0;}
.sr-book-row-title>span{font-family:${SERIF_FONT};font-size:13.5px;font-weight:600;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-book-row-title>svg{flex:none;color:var(--dsw-alias-brand-primary);opacity:.8;}
.sr-book-row-rating{display:inline-flex;align-items:center;gap:2px;margin-left:5px;color:var(--dsw-alias-brand-primary);font-size:8.5px;}
.sr-book-row-meta{font-size:9.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-book-row-words{display:inline-block;margin-left:6px;padding:0 4px;border-radius:3px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 60%,transparent);font-size:8.5px;font-variant-numeric:tabular-nums;opacity:.85;}
.sr-book-row-progress{display:flex;align-items:center;margin-top:2px;max-width:330px;}
.sr-book-row-side{display:flex;align-items:center;gap:7px;flex:none;color:var(--dsw-alias-label-secondary);}
.sr-book-row-pct{font-size:9px;font-variant-numeric:tabular-nums;min-width:30px;text-align:right;opacity:.8;}
.sr-book-row-import{border-style:dashed;background:transparent;color:var(--dsw-alias-label-secondary);}
.sr-book-row-import:hover{color:var(--dsw-alias-label-primary);border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 45%,var(--dsw-alias-border-l2));}
.sr-book-import-icon{width:42px;height:54px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:3px 5px 5px 3px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-brand-primary);}
.sr-book-card{
  appearance:none;position:relative;display:block;width:100%;min-width:0;padding:0;border:0;border-radius:8px;
  background:transparent;text-align:left;cursor:pointer;color:inherit;
  contain:layout paint style;content-visibility:auto;contain-intrinsic-size:auto 240px;
}
.sr-book-cover-wrap{position:relative;display:block;}
.sr-book-quick-read{
  position:absolute;right:8px;bottom:8px;z-index:9;
  width:28px;height:28px;border-radius:50%;border:1px solid color-mix(in oklab,var(--dsw-alias-label-primary) 28%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 94%,transparent);
  color:var(--dsw-alias-label-primary);display:none;align-items:center;justify-content:center;
  cursor:pointer;transform:scale(.85);transition:transform .18s ease,background .15s ease;
  box-shadow:0 3px 8px rgba(0,0,0,.28);
}
.sr-book-card:hover .sr-book-quick-read,
.sr-book-card:focus-visible .sr-book-quick-read{display:flex;transform:scale(1);}
.sr-book-quick-read:hover{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border-color:var(--dsw-alias-brand-primary);transform:scale(1.08);}
.sr-book-row-read-btn{
  appearance:none;display:inline-flex;align-items:center;gap:4px;padding:3px 7px;
  border-radius:5px;border:1px solid color-mix(in oklab,var(--dsw-alias-brand-primary) 32%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);
  color:var(--dsw-alias-brand-primary);font-size:9.5px;font-weight:500;cursor:pointer;
  transition:background .15s ease,color .15s ease,transform .15s ease;
}
.sr-book-row-read-btn:hover{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);}
.sr-book-card .sr-cover{
  transition:transform .22s cubic-bezier(.2,.7,.25,1),box-shadow .22s ease,filter .22s ease;
  box-shadow:0 1px 2px rgba(0,0,0,.12),0 9px 18px -16px rgba(0,0,0,.48),0 20px 30px -26px rgba(0,0,0,.55);
}
.sr-book-card:hover .sr-cover{transform:translateY(-5px) rotate(-.35deg);box-shadow:0 2px 4px rgba(0,0,0,.12),0 17px 26px -17px rgba(0,0,0,.48),0 30px 44px -30px rgba(0,0,0,.55);}
.sr-book-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px;}
.sr-book-card[data-select-mode="true"] .sr-cover{filter:saturate(.92);}
.sr-book-card[data-selected="true"] .sr-cover{outline:2.5px solid var(--dsw-alias-brand-primary);outline-offset:3px;box-shadow:0 0 0 6px color-mix(in oklab,var(--dsw-alias-brand-primary) 18%,transparent),0 12px 24px -10px rgba(0,0,0,.3);}
.sr-book-card[data-selected="true"] .sr-book-title{color:var(--dsw-alias-brand-primary);}
.sr-book-check{
  position:absolute;z-index:11;top:8px;right:8px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;border:1.5px solid color-mix(in oklab,var(--dsw-alias-label-primary) 35%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 94%,transparent);
  color:transparent;box-shadow:0 2px 6px -2px rgba(0,0,0,.25);
  transition:transform .15s cubic-bezier(.175,.885,.32,1.275),border-color .15s ease,background .15s ease;
}
.sr-book-check--row{position:static;flex:none;margin-right:2px;}
.sr-book-card:hover .sr-book-check:not([data-selected="true"]),
.sr-book-row:hover .sr-book-check:not([data-selected="true"]){border-color:var(--dsw-alias-brand-primary);transform:scale(1.08);}
.sr-book-card[data-selected="true"] .sr-book-check,
.sr-book-row[data-selected="true"] .sr-book-check{
  background:var(--dsw-alias-brand-primary) !important;border-color:var(--dsw-alias-brand-primary) !important;color:var(--dsw-alias-bg-base) !important;
  box-shadow:0 2px 8px -2px color-mix(in oklab,var(--dsw-alias-brand-primary) 70%,transparent) !important;
  animation:sr-check-pop .2s cubic-bezier(.175,.885,.32,1.275);
}
@keyframes sr-check-pop{0%{transform:scale(.7);}50%{transform:scale(1.15);}100%{transform:scale(1);}}
.sr-book-row[data-selected="true"]{border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 46%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,var(--dsw-alias-bg-layer-1));box-shadow:0 0 0 1px color-mix(in oklab,var(--dsw-alias-brand-primary) 24%,transparent);}
.sr-shelf-select,.sr-batch-dock,.sr-notes-tools .sr-select-bar{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:95;
  display:inline-flex;align-items:center;justify-content:center;gap:0;
  padding:6px;border-radius:18px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 88%,transparent);
  box-shadow:0 20px 48px -12px rgba(0,0,0,.3),0 3px 10px -2px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  max-width:calc(100vw - 32px);
  animation:sr-dock-rise .22s cubic-bezier(.16,1,.3,1);
}
@keyframes sr-dock-rise{
  0%{opacity:0;transform:translate(-50%,16px) scale(.97);}
  100%{opacity:1;transform:translate(-50%,0) scale(1);}
}
.sr-batch-dock-inner{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:nowrap;}
.sr-shelf-select-main{display:flex;align-items:center;gap:8px;min-width:0;flex:none;}
.sr-shelf-select-summary{
  display:inline-flex;align-items:center;gap:6px;min-width:0;
  height:28px;padding:0 10px;border-radius:999px;
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);
  border:1px solid color-mix(in oklab,var(--dsw-alias-brand-primary) 22%,transparent);
}
.sr-shelf-select-dot{
  width:6px;height:6px;flex:none;border-radius:50%;
  background:var(--dsw-alias-brand-primary);
  box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 22%,transparent);
}
.sr-shelf-select-count{
  font-size:11.5px;font-weight:650;letter-spacing:.01em;white-space:nowrap;
  color:var(--dsw-alias-brand-primary);font-variant-numeric:tabular-nums;
}
.sr-shelf-select-hint{display:none;}
.sr-shelf-select-links{display:inline-flex;align-items:center;gap:1px;padding:1px;flex:none;}
.sr-shelf-select-links .sr-link-btn{
  height:24px;padding:0 7px;border:0;border-radius:6px;
  background:transparent;color:var(--dsw-alias-label-secondary);
  font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;
  transition:all .14s ease;
}
.sr-shelf-select-links .sr-link-btn:hover:not(:disabled){
  color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 8%,transparent);
}
.sr-shelf-select-links .sr-link-btn:disabled{opacity:.35;cursor:not-allowed;}
.sr-batch-divider{
  width:1px;height:18px;background:color-mix(in oklab,var(--dsw-alias-border-l1) 75%,transparent);
  margin:0 2px;flex:none;
}
.sr-shelf-select-actions,.sr-select-actions{display:flex;align-items:center;gap:3px;flex:none;}
.sr-bulk-action{
  display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 10px;
  border:1px solid transparent;border-radius:8px;background:transparent;
  color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;font-weight:500;
  cursor:pointer;white-space:nowrap;
  transition:background .14s ease,color .14s ease,border-color .14s ease,transform .08s ease;
}
.sr-bulk-action:hover:not(:disabled){
  background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);
  border-color:color-mix(in oklab,var(--dsw-alias-border-l1) 60%,transparent);
  color:var(--dsw-alias-label-primary);
}
.sr-bulk-action:active:not(:disabled){transform:scale(.97);}
.sr-bulk-action[data-active="true"],.sr-bulk-action[aria-expanded="true"]{
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);
  border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 30%,transparent);
  color:var(--dsw-alias-brand-primary);font-weight:600;
}
.sr-bulk-action-highlight{
  color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);
}
.sr-bulk-danger,.sr-bulk-action[data-danger="true"]{
  color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 88%,var(--dsw-alias-label-primary));
}
.sr-bulk-danger:hover:not(:disabled),.sr-bulk-action[data-danger="true"]:hover:not(:disabled){
  background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 10%,transparent) !important;
  border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 30%,transparent) !important;
  color:var(--dsw-alias-state-error-primary) !important;
}
.sr-bulk-action:disabled,.sr-bulk-more:disabled{opacity:.35;cursor:not-allowed;}
.sr-bulk-more{
  display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 9px;
  border:1px solid transparent;border-radius:8px;background:transparent;
  color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:500;
  cursor:pointer;white-space:nowrap;
  transition:background .14s ease,color .14s ease,border-color .14s ease;
}
.sr-bulk-more:hover:not(:disabled),.sr-bulk-more[aria-expanded="true"]{
  background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);
  border-color:color-mix(in oklab,var(--dsw-alias-border-l1) 60%,transparent);
  color:var(--dsw-alias-label-primary);
}
.sr-bulk-done{
  display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 14px;
  border:0;border-radius:999px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);
  font:inherit;font-size:11.5px;font-weight:600;cursor:pointer;white-space:nowrap;
  box-shadow:0 2px 8px -1px color-mix(in oklab,var(--dsw-alias-brand-primary) 60%,transparent);
  transition:filter .14s ease,transform .14s ease,box-shadow .14s ease;
}
.sr-bulk-done:hover{
  filter:brightness(1.08);transform:translateY(-1px);
  box-shadow:0 4px 12px -1px color-mix(in oklab,var(--dsw-alias-brand-primary) 70%,transparent);
}
.sr-bulk-done:active{transform:translateY(0);filter:brightness(.96);}
.sr-bulk-action:focus-visible,.sr-bulk-more:focus-visible,.sr-bulk-done:focus-visible,
.sr-shelf-select-links .sr-link-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.sr-bulk-scrim{position:fixed;inset:0;z-index:99;border:0;padding:0;background:transparent;cursor:default;}
.sr-bulk-menu,.sr-batch-popover-menu{
  position:absolute;bottom:calc(100% + 12px);right:10px;left:auto;z-index:102;
  min-width:196px;padding:6px;border-radius:14px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 94%,transparent);
  box-shadow:0 22px 50px -14px rgba(0,0,0,.38),0 3px 10px -2px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  animation:sr-menu-up .15s cubic-bezier(.16,1,.3,1);
}
@keyframes sr-menu-up{
  0%{opacity:0;transform:translateY(6px) scale(.98);}
  100%{opacity:1;transform:translateY(0) scale(1);}
}
.sr-bulk-menu button{
  display:flex;align-items:center;gap:8px;width:100%;height:31px;padding:0 9px;
  border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);
  font:inherit;font-size:11.5px;font-weight:500;text-align:left;cursor:pointer;
  transition:background .12s ease,color .12s ease;
}
.sr-bulk-menu button:hover:not(:disabled){
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 10%,transparent);
  color:var(--dsw-alias-brand-primary);
}
.sr-bulk-menu button:disabled{opacity:.35;cursor:not-allowed;}
.sr-bulk-menu-divider{height:1px;margin:4px 4px;background:color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);}
.sr-bulk-menu-danger{color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 85%,var(--dsw-alias-label-primary)) !important;}
.sr-bulk-menu-danger:hover:not(:disabled){
  background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 10%,transparent) !important;
  color:var(--dsw-alias-state-error-primary) !important;
}

/* Upward Popovers for Tags, Colors, Delete */
.sr-batch-popover{
  position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);z-index:102;
  border-radius:14px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 94%,transparent);
  box-shadow:0 22px 50px -14px rgba(0,0,0,.38),0 3px 10px -2px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  animation:sr-pop-up .18s cubic-bezier(.16,1,.3,1);
}
@keyframes sr-pop-up{
  0%{opacity:0;transform:translate(-50%,8px) scale(.98);}
  100%{opacity:1;transform:translate(-50%,0) scale(1);}
}
.sr-batch-popover-head{
  display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;
}
.sr-batch-popover-title{
  display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);
}
.sr-batch-popover-close{width:22px;height:22px;border-radius:6px;}
.sr-batch-popover-input-row{display:flex;align-items:center;gap:7px;width:100%;}
.sr-shelf-bulk-tag,.sr-bulk-tag{
  width:min(440px,calc(100vw - 32px));padding:13px 15px;
}
.sr-bulk-tag-input{
  flex:1;min-width:0;height:31px;padding:0 10px;border-radius:8px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 85%,transparent);
  color:var(--dsw-alias-label-primary);font-family:${UI_FONT};font-size:11.5px;
  transition:border-color .15s ease,box-shadow .15s ease;
}
.sr-bulk-tag-input:focus{
  outline:none;border-color:var(--dsw-alias-brand-primary);
  box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 20%,transparent);
}
.sr-bulk-tag-input::placeholder{color:color-mix(in oklab,var(--dsw-alias-label-secondary) 80%,transparent);}
.sr-shelf-bulk-tag-suggest{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:9px;}
.sr-shelf-delete-bar{
  width:min(420px,calc(100vw - 32px));padding:14px 16px;
  border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 35%,var(--dsw-alias-border-l1));
  background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 7%,var(--dsw-alias-bg-overlay));
  display:flex;flex-direction:column;gap:12px;
}
.sr-batch-popover-danger-head{
  display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;
  color:var(--dsw-alias-label-primary);line-height:1.5;
}
.sr-batch-popover-danger-head svg{flex:none;color:var(--dsw-alias-state-error-primary);}
.sr-shelf-delete-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;width:100%;}
.sr-bulk-color-dock{padding:11px 15px;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100vw - 32px));}
.sr-bulk-color-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.sr-bulk-color-dock .sr-color-filter-dot{
  width:24px;height:24px;border-radius:50%;cursor:pointer;
  box-shadow:0 2px 5px -1px rgba(0,0,0,.25);
  transition:transform .14s cubic-bezier(.175,.885,.32,1.275),box-shadow .14s ease;
}
.sr-bulk-color-dock .sr-color-filter-dot:hover{
  transform:scale(1.2);box-shadow:0 3px 8px -1px rgba(0,0,0,.35);
}
.sr-book-meta{padding:10px 2px 0;min-width:0;}
.sr-book-pin{position:absolute;z-index:10;top:7px;left:7px;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-brand-primary);box-shadow:0 2px 6px -2px rgba(0,0,0,.32);}
.sr-book-title{
  margin:0;font-family:${SERIF_FONT};font-size:13.5px;line-height:1.45;font-weight:600;letter-spacing:.02em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.sr-book-author{
  margin:3px 0 0;font-size:10.5px;color:var(--dsw-alias-label-secondary);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9;
}
.sr-book-rating{display:flex;align-items:center;gap:1px;margin-top:4px;color:var(--dsw-alias-brand-primary);opacity:.82;}
.sr-book-rating svg{flex:none;}
.sr-book-progress{margin-top:8px;display:flex;align-items:center;gap:7px;}
.sr-book-track{height:2px;border-radius:2px;flex:1;background:color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);overflow:hidden;}
.sr-book-fill{height:100%;border-radius:inherit;background:var(--sr-accent-strong);opacity:.85;}
.sr-book-pct{font-size:9.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;min-width:22px;text-align:right;opacity:.84;}
.sr-cover{
  position:relative;display:block;width:100%;aspect-ratio:3/4;overflow:hidden;isolation:isolate;
  border-radius:3px 9px 9px 3px;
  background:
    radial-gradient(120% 120% at 82% 6%,color-mix(in oklab,var(--cv-accent) 48%,transparent),transparent 48%),
    linear-gradient(150deg,var(--cv-a),var(--cv-b));
  color:var(--cv-ink);
  box-shadow:0 1.5px 3px rgba(0,0,0,.12),0 12px 24px -14px rgba(0,0,0,.5);
  transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s ease;
}
.sr-cover::before{
  content:"";position:absolute;z-index:5;inset:0 auto 0 0;width:8px;
  background:linear-gradient(90deg,rgba(0,0,0,.32),rgba(0,0,0,.08) 45%,transparent);
  box-shadow:inset -1px 0 0 rgba(255,255,255,.08);
}
.sr-cover::after{
  content:"";position:absolute;z-index:1;inset:0;pointer-events:none;
  background:
    radial-gradient(100% 80% at 15% 100%,rgba(0,0,0,.28),transparent 60%),
    linear-gradient(115deg,rgba(255,255,255,.08),transparent 36%);
}
.sr-cover--image{background:#20252a;}
.sr-cover-image{position:absolute;z-index:2;inset:0;display:block;width:100%;height:100%;object-fit:cover;image-rendering:-webkit-optimize-contrast;}
.sr-cover--image::after{z-index:4;background:linear-gradient(to top,rgba(0,0,0,.4),transparent 38%),linear-gradient(115deg,rgba(255,255,255,.07),transparent 36%);}
.sr-cover--image .sr-cover-glyph,.sr-cover--image .sr-cover-title,.sr-cover--image .sr-cover-author,.sr-cover--image .sr-cover-mark{display:none;}
.sr-cover--image .sr-cover-badge{z-index:6;}
.sr-cover-glyph{
  position:absolute;z-index:0;right:-9%;top:-9%;font-family:${SERIF_FONT};font-size:118px;line-height:1;
  color:var(--cv-accent);opacity:.16;transform:rotate(3deg);pointer-events:none;
}
.sr-cover-title{
  position:absolute;z-index:3;top:10%;right:17%;max-height:78%;
  writing-mode:vertical-rl;text-orientation:upright;
  font-family:${SERIF_FONT};font-size:17px;line-height:1.4;letter-spacing:.19em;font-weight:600;
  text-shadow:0 1px 1px rgba(0,0,0,.16);
  overflow:hidden;
}
.sr-cover-title--latin{
  writing-mode:horizontal-tb;top:14%;left:17%;right:12%;max-height:56%;letter-spacing:.02em;
  font-size:15px;line-height:1.35;
}
.sr-cover-title--long{font-size:14px;line-height:1.35;letter-spacing:.1em;}
.sr-cover-title--xlong{font-size:12px;line-height:1.3;letter-spacing:.05em;}
.sr-cover-author{
  position:absolute;z-index:3;left:17%;bottom:12%;writing-mode:vertical-rl;text-orientation:upright;
  font-family:${SERIF_FONT};font-size:8px;letter-spacing:.16em;opacity:.74;
}
.sr-cover-author--latin{writing-mode:horizontal-tb;left:17%;right:14%;bottom:10%;font-family:${UI_FONT};font-size:8px;}
.sr-cover-mark{
  position:absolute;z-index:3;left:17%;top:9%;font-family:${SERIF_FONT};font-size:6.5px;letter-spacing:.25em;
  opacity:.55;border:1px solid currentColor;padding:3px 1px 3px 3px;line-height:1;
}
.sr-cover-badge{
  position:absolute;z-index:6;right:7px;bottom:7px;padding:2px 7px;border-radius:999px;
  font-family:${UI_FONT};font-size:7.5px;font-weight:600;letter-spacing:.05em;line-height:1.35;
  color:var(--cv-ink);background:color-mix(in oklab,var(--cv-ink) 24%,transparent);
  border:1px solid color-mix(in oklab,var(--cv-ink) 28%,transparent);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  box-shadow:0 2px 6px rgba(0,0,0,.16);
}
.sr-cover-progress{position:absolute;z-index:7;left:0;right:0;bottom:0;height:3.5px;background:rgba(0,0,0,.22);backdrop-filter:blur(2px);}
.sr-cover-progress span{display:block;height:100%;background:linear-gradient(90deg,var(--cv-accent),color-mix(in oklab,var(--cv-accent) 70%,#fff));opacity:.95;}
.sr-cover--sm{width:42px;flex:0 0 42px;border-radius:2px 5px 5px 2px;}
.sr-cover--sm .sr-cover-title{display:none;}
.sr-cover--sm .sr-cover-author,.sr-cover--sm .sr-cover-mark,.sr-cover--sm .sr-cover-badge{display:none;}
.sr-cover--sm .sr-cover-glyph{font-size:54px;}
.sr-cover--lg{width:178px;max-width:100%;border-radius:5px 11px 11px 5px;}
.sr-cover--lg .sr-cover-title{font-size:26px;letter-spacing:.16em;max-height:80%;}
.sr-cover--lg .sr-cover-title--long{font-size:20px;letter-spacing:.07em;}
.sr-cover--lg .sr-cover-title--xlong{font-size:16px;letter-spacing:.03em;}
.sr-cover--lg .sr-cover-title--latin{font-size:17px;line-height:1.4;letter-spacing:.01em;max-height:58%;}
.sr-cover--lg .sr-cover-glyph{font-size:190px;}
.sr-cover--lg .sr-cover-author{font-size:10px;}
.sr-cover--lg .sr-cover-mark{font-size:8px;}
.sr-cover--lg .sr-cover-badge{font-size:9px;padding:3px 7px;}
.sr-import-card{
  appearance:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;
  aspect-ratio:3/4;width:100%;padding:15px;border-radius:4px 9px 9px 4px;
  border:1.5px dashed color-mix(in oklab,var(--dsw-alias-border-l2) 75%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 46%,transparent);
  color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:center;
  transition:border-color .16s ease,background .16s ease,color .16s ease;
}
.sr-import-card:hover{
  border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 58%,var(--dsw-alias-border-l2));
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 6%,var(--dsw-alias-bg-layer-1));
  color:var(--dsw-alias-label-primary);
}
.sr-import-card svg{opacity:.7;}
.sr-import-title{font-size:12px;font-weight:600;letter-spacing:.02em;}
.sr-import-text{font-size:9.5px;opacity:.7;letter-spacing:.02em;}
.sr-import-multi{padding:1px 5px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);color:var(--dsw-alias-brand-primary);font-size:8px;line-height:1.5;letter-spacing:.02em;}
.sr-shelf-footer{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:25px;font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.8;}
.sr-shelf-footer-actions{display:flex;align-items:center;gap:2px;}
.sr-text-btn{appearance:none;display:inline-flex;align-items:center;gap:4px;border:0;border-radius:5px;padding:3px 5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10px;cursor:pointer;transition:background .14s ease,color .14s ease;}
.sr-text-btn:hover{color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);}
.sr-text-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.sr-text-btn svg{opacity:.75;}
.sr-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;
  min-height:240px;padding:36px 22px;text-align:center;color:var(--dsw-alias-label-secondary);
}
.sr-empty-art{margin-bottom:7px;opacity:.92;max-width:100%;}
.sr-empty h3{margin:0;font-family:${SERIF_FONT};font-size:17px;font-weight:600;color:var(--dsw-alias-label-primary);letter-spacing:.03em;}
.sr-empty p{margin:0;max-width:380px;font-size:12px;line-height:1.75;}
.sr-empty .sr-btn{margin-top:12px;}
.sr-page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:4px 0 23px;}
.sr-page-head h1{margin:0;font-family:${SERIF_FONT};font-size:clamp(23px,2.6vw,31px);line-height:1.25;font-weight:600;letter-spacing:.05em;}
.sr-page-head p{margin:7px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.65;}
.sr-page-head-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end;}
.sr-page-head-stat{text-align:right;flex:none;padding-bottom:3px;}
.sr-page-head-stat strong{display:block;font-size:23px;font-weight:620;font-variant-numeric:tabular-nums;letter-spacing:-.02em;}
.sr-page-head-stat span{display:block;margin-top:2px;font-size:10.5px;color:var(--dsw-alias-label-secondary);}

.sr-notes-head-actions{display:flex;align-items:center;gap:8px;flex:none;padding-bottom:2px;}
.sr-notebook-tabs{display:inline-flex;align-items:center;gap:2px;padding:3px;margin:0 0 16px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 82%,transparent);border-radius:10px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 70%,transparent);}
.sr-notebook-tab{appearance:none;display:inline-flex;align-items:center;gap:6px;height:29px;padding:0 12px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;cursor:pointer;white-space:nowrap;transition:background .14s ease,color .14s ease,box-shadow .14s ease;}
.sr-notebook-tab:hover{color:var(--dsw-alias-label-primary);}
.sr-notebook-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 2px rgba(0,0,0,.07),inset 0 0 0 1px color-mix(in oklab,var(--dsw-alias-border-l1) 66%,transparent);}
.sr-notebook-tab-count{font-size:9.5px;color:var(--dsw-alias-label-secondary);opacity:.68;font-variant-numeric:tabular-nums;}
.sr-notes-tools{display:flex;align-items:center;gap:7px;margin-bottom:14px;}
.sr-hit{border-radius:2px;padding:0 1px;background:color-mix(in oklab,var(--sr-accent-strong) 46%,transparent);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px color-mix(in oklab,var(--sr-accent-strong) 34%,transparent);}
.sr-note-card.is-selecting,.sr-bookmark-card.is-selecting{position:relative;cursor:pointer;}
.sr-select-overlay{position:absolute;inset:0;z-index:4;padding:0;border:0;border-radius:inherit;background:transparent;cursor:pointer;}
.sr-select-overlay:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.sr-select-check{
  position:absolute;top:8px;right:8px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;border:1.5px solid color-mix(in oklab,var(--dsw-alias-label-primary) 32%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 88%,transparent);color:transparent;
  box-shadow:0 2px 6px -2px rgba(0,0,0,.25);
  transition:transform .15s cubic-bezier(.175,.885,.32,1.275),border-color .15s ease,background .15s ease;
}
.sr-note-card.is-selecting:hover .sr-select-check,
.sr-bookmark-card.is-selecting:hover .sr-select-check{border-color:var(--dsw-alias-brand-primary);transform:scale(1.08);}
.sr-note-card[data-selected="true"],.sr-bookmark-card[data-selected="true"]{
  border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 46%,var(--dsw-alias-border-l1)) !important;
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 7%,var(--dsw-alias-bg-layer-1)) !important;
  box-shadow:0 0 0 1.5px color-mix(in oklab,var(--dsw-alias-brand-primary) 30%,transparent) !important;
}
.sr-note-card[data-selected="true"] .sr-select-check,.sr-bookmark-card[data-selected="true"] .sr-select-check{
  background:var(--dsw-alias-brand-primary) !important;border-color:var(--dsw-alias-brand-primary) !important;color:var(--dsw-alias-bg-base) !important;
  box-shadow:0 2px 8px -2px color-mix(in oklab,var(--dsw-alias-brand-primary) 70%,transparent) !important;
  animation:sr-check-pop .2s cubic-bezier(.175,.885,.32,1.275);
}
.sr-reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:9px;}
.sr-review-card{display:flex;flex-direction:column;width:100%;min-width:0;padding:11px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 72%,transparent);border-radius:10px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 64%,transparent);color:inherit;font:inherit;text-align:left;transition:background .14s ease,border-color .14s ease;}
.sr-review-card:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2);}
.sr-review-card-click{display:flex;align-items:flex-start;gap:11px;width:100%;min-width:0;cursor:pointer;outline:none;}
.sr-review-card-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px;}
.sr-review-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0;}
.sr-review-card-head strong{font-family:${SERIF_FONT};font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-review-card-head span{flex:none;font-size:8px;color:var(--dsw-alias-label-secondary);opacity:.7;}
.sr-review-card-stars{font-size:9px;letter-spacing:1px;color:var(--dsw-alias-brand-primary);}
.sr-review-card-main p{margin:0;font-size:10.5px;line-height:1.65;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;}
.sr-review-card-foot{display:flex;align-items:center;justify-content:flex-end;margin-top:6px;padding-top:4px;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 50%,transparent);}
.sr-review-card-action{appearance:none;display:inline-flex;align-items:center;gap:4px;padding:2.5px 7px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);border-radius:6px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 80%,transparent);color:var(--dsw-alias-label-secondary);font-size:9.5px;cursor:pointer;transition:all .14s ease;}
.sr-review-card-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary);}
.sr-notes-search{margin:0;flex:1;min-width:0;}
.sr-notes-sort{display:inline-flex;align-items:center;gap:3px;flex:none;color:var(--dsw-alias-label-secondary);}
.sr-notes-sort select{height:35px;max-width:104px;padding:0 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:10px;outline:none;cursor:pointer;}
.sr-notes-sort select:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);}
.sr-notes-search{display:flex;align-items:center;gap:7px;height:35px;margin:0 0 14px;padding:0 8px 0 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 76%,transparent);color:var(--dsw-alias-label-secondary);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;}
.sr-notes-search:focus-within{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 13%,transparent);}
.sr-notes-search>svg{flex:none;opacity:.76;}
.sr-notes-search input{appearance:none;-webkit-appearance:none;flex:1;min-width:0;height:33px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-size:12.5px;outline:none;}
.sr-notes-search input::placeholder{color:var(--dsw-alias-label-secondary);}
.sr-notes-search-clear{width:21px;height:21px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-notes-search-clear:hover{color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 12%,transparent);}
.sr-bookmarks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:13px;}
.sr-bookmark-card{display:flex;flex-direction:column;gap:8px;padding:12px 13px 9px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 82%,transparent);border-radius:13px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 78%,transparent);transition:border-color .15s ease,box-shadow .15s ease;}
.sr-bookmark-card:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 9px 24px -23px rgba(0,0,0,.5);}
.sr-bookmark-main-btn{appearance:none;display:flex;align-items:center;gap:11px;width:100%;padding:1px 0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit;min-width:0;}
.sr-bookmark-card-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}
.sr-bookmark-card-info strong{font-family:${SERIF_FONT};font-size:12.5px;line-height:1.45;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-bookmark-card-info span{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-bookmark-card-info small{font-size:9px;color:var(--dsw-alias-label-secondary);opacity:.72;font-variant-numeric:tabular-nums;}
.sr-bookmark-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:2px;flex-wrap:wrap;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 55%,transparent);padding-top:5px;}
.sr-note-editor-backdrop{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,13,12,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:sr-fade .15s ease;}
.sr-note-editor{width:min(462px,100%);max-height:calc(100vh - 48px);overflow-y:auto;padding:20px;border-radius:17px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 26px 70px -26px rgba(0,0,0,.58);animation:sr-pop .17s ease;}
.sr-note-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}
.sr-note-editor-head h2{margin:0;font-family:${SERIF_FONT};font-size:18px;font-weight:600;letter-spacing:.04em;}
.sr-note-editor-head p{margin:4px 0 0;font-size:10px;color:var(--dsw-alias-label-secondary);}
.sr-note-editor-quote{margin:0 0 12px;padding:10px 12px;border-left:2px solid var(--sr-hl,var(--dsw-alias-brand-primary));border-radius:0 7px 7px 0;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 62%,transparent);font-family:${SERIF_FONT};font-size:12px;line-height:1.82;max-height:128px;overflow-y:auto;white-space:pre-wrap;}
.sr-note-editor-textarea{width:100%;min-height:112px;resize:vertical;padding:10px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 52%,transparent);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.7;outline:none;}
.sr-note-editor-textarea::placeholder{color:var(--dsw-alias-label-secondary);}
.sr-note-editor-textarea:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 14%,transparent);}
.sr-note-editor-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;}
.sr-note-editor-colors{display:flex;align-items:center;gap:7px;}
.sr-note-editor-color{width:16px;height:16px;padding:0;border:1px solid rgba(0,0,0,.13);border-radius:50%;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;}
.sr-note-editor-color:hover{transform:scale(1.12);}
.sr-note-editor-color[aria-pressed="true"]{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 0 3.5px var(--dsw-alias-brand-primary);}
.sr-note-editor-actions{display:flex;align-items:center;gap:6px;}

.sr-notes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:15px;align-items:start;}
.sr-notes-months{display:flex;flex-direction:column;gap:19px;}
.sr-notes-month-head{display:flex;align-items:baseline;gap:8px;margin:0 0 9px;padding-bottom:6px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 62%,transparent);}
.sr-notes-month-head .sr-notes-month-title{font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-primary);}
.sr-notes-month-count{font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.sr-notes-books{display:flex;flex-direction:column;gap:15px;}
.sr-notes-book{display:flex;flex-direction:column;gap:9px;}
.sr-notes-book-head{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 74%,transparent);border-radius:9px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 30%,transparent);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease;}
.sr-notes-book-head:hover{border-color:color-mix(in oklab,var(--sr-accent-strong) 42%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--sr-accent-strong) 9%,transparent);}
.sr-notes-book-head svg{flex:none;color:var(--dsw-alias-label-secondary);}
.sr-notes-book-title{min-width:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-notes-book-author{min-width:0;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-notes-book-count{margin-left:auto;flex:none;font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.sr-notes-book[data-collapsed="true"] .sr-notes-book-head{background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 18%,transparent);}
.sr-notes-book[data-collapsed="true"] .sr-notes-book-title{color:var(--dsw-alias-label-secondary);}
.sr-note-card{
  position:relative;display:flex;flex-direction:column;gap:12px;min-width:0;
  padding:17px 17px 14px;border-radius:14px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 84%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 82%,transparent);
  box-shadow:0 1px 3px rgba(0,0,0,.03);
  transition:border-color .16s ease,box-shadow .18s cubic-bezier(.16,1,.3,1),transform .18s cubic-bezier(.16,1,.3,1);
  content-visibility:auto;contain-intrinsic-size:auto 120px;
}
.sr-note-card:hover{
  border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 35%,var(--dsw-alias-border-l1));
  box-shadow:0 14px 28px -16px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.04);
  transform:translateY(-2px);
}
.sr-note-top{display:flex;align-items:center;gap:10px;min-width:0;}
.sr-note-book{min-width:0;flex:1;}
.sr-note-book strong{display:block;font-family:${SERIF_FONT};font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-note-book span{display:block;margin-top:2px;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-note-quote{
  position:relative;margin:0;padding-left:14px;font-family:${SERIF_FONT};font-size:14px;
  line-height:1.82;letter-spacing:.02em;color:var(--dsw-alias-label-primary);
  display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;
}
.sr-note-quote::before{content:"";position:absolute;left:0;top:3px;bottom:3px;width:3px;border-radius:999px;background:var(--sr-hl,var(--dsw-alias-brand-primary));opacity:.88;}
.sr-note-thought{
  margin:0;padding:10px 11px;border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 72%,transparent);
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 54%,transparent);
  font-size:12px;line-height:1.7;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;
}
.sr-note-thought-label{display:flex;align-items:center;gap:5px;margin:0 0 4px;font-size:9.5px;font-weight:600;letter-spacing:.08em;color:var(--dsw-alias-label-secondary);text-transform:uppercase;}
.sr-note-foot{display:flex;align-items:flex-end;justify-content:flex-end;gap:9px;margin-top:auto;}
.sr-note-date{font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.78;font-variant-numeric:tabular-nums;flex:none;white-space:nowrap;}
.sr-note-actions{display:flex;align-items:center;justify-content:flex-end;gap:3px;flex-wrap:wrap;flex:1;min-width:0;}
.sr-link-btn{
  appearance:none;border:0;background:transparent;padding:4px 7px;border-radius:6px;
  color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer;white-space:nowrap;
  transition:background .14s ease,color .14s ease;
}
.sr-link-btn:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);color:var(--dsw-alias-label-primary);}
.sr-link-btn[data-danger="true"]:hover{background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 11%,transparent);color:var(--dsw-alias-state-error-primary);}
.sr-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:16px;}
.sr-stat-card{
  padding:16px 16px 14px;border-radius:13px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 78%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 72%,transparent);min-width:0;
}
.sr-stat-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 10%,transparent);color:var(--dsw-alias-brand-primary);margin-bottom:12px;}
.sr-stat-value{font-size:22px;line-height:1.2;font-weight:620;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-stat-value small{font-size:10.5px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-left:2px;letter-spacing:0;}
.sr-stat-label{margin-top:4px;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.sr-chart-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(250px,.7fr);gap:15px;align-items:stretch;margin-bottom:16px;}
.sr-panel{
  border-radius:15px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 76%,transparent);padding:20px;
}
.sr-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;}
.sr-panel-head h2{margin:0;font-family:${SERIF_FONT};font-size:16px;font-weight:600;letter-spacing:.03em;}
.sr-panel-head p{margin:4px 0 0;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.sr-week-delta{font-variant-numeric:tabular-nums;font-weight:600;}
.sr-week-delta[data-direction="up"]{color:var(--sr-accent-strong);}
.sr-week-delta[data-direction="down"]{color:color-mix(in oklab,var(--dsw-alias-label-secondary) 88%,var(--dsw-alias-label-primary));}
.sr-week-delta[data-direction="flat"]{color:var(--dsw-alias-label-secondary);font-weight:500;}
.sr-week-delta[data-direction="none"]{color:var(--dsw-alias-label-secondary);font-weight:500;}
.sr-search-nav{display:flex;align-items:center;gap:2px;padding-left:6px;margin-left:2px;border-left:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);flex:none;}
.sr-search-nav-count{font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;padding-right:3px;}
.sr-search-step{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-search-step:hover{background:color-mix(in oklab,var(--sr-accent-strong) 16%,transparent);color:var(--sr-accent-strong);}
.sr-search-result[data-active="true"]{border-color:color-mix(in oklab,var(--sr-accent-strong) 52%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--sr-accent-strong) 12%,transparent);}
.sr-search-field input[type="search"]::-webkit-search-cancel-button,
.sr-notes-search input[type="search"]::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none;}
.sr-panel-total{text-align:right;}
.sr-panel-total strong{display:block;font-size:18px;line-height:1.2;font-weight:620;font-variant-numeric:tabular-nums;}
.sr-panel-total span{font-size:9.5px;color:var(--dsw-alias-label-secondary);}
.sr-bars{display:flex;align-items:flex-end;gap:clamp(8px,2.2vw,20px);height:150px;padding:7px 4px 0;}
.sr-bar-col{flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;}
.sr-bar-slot{width:100%;max-width:29px;height:100%;display:flex;align-items:flex-end;justify-content:center;border-radius:5px 5px 2px 2px;background:color-mix(in oklab,var(--dsw-alias-border-l1) 45%,transparent);overflow:hidden;}
.sr-bar{width:100%;min-height:3px;border-radius:4px 4px 1px 1px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 45%,var(--dsw-alias-bg-layer-2));transition:height .35s ease;}
.sr-bar-col[data-today="true"] .sr-bar{background:var(--sr-accent-strong);}
.sr-bar-col[data-today="true"] .sr-bar-label{color:var(--dsw-alias-label-primary);font-weight:650;}
.sr-bar-label{font-size:9.5px;color:var(--dsw-alias-label-secondary);line-height:1;}
.sr-bar-value{font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.72;font-variant-numeric:tabular-nums;height:10px;line-height:10px;}
.sr-goal-panel{display:flex;flex-direction:column;justify-content:space-between;gap:17px;background:radial-gradient(110% 100% at 100% 0%,color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent),transparent 62%),var(--dsw-alias-bg-layer-1);}
.sr-goal-panel-top{display:flex;align-items:center;gap:15px;}
.sr-goal-panel-ring{position:relative;width:78px;height:78px;flex:none;}
.sr-goal-panel-ring .sr-ring{width:78px;height:78px;}
.sr-goal-panel-ring .sr-ring circle{stroke-width:5.4;}
.sr-goal-panel-ring .sr-ring-label{font-size:14px;}
.sr-goal-panel-text small{display:block;font-size:9.5px;color:var(--dsw-alias-label-secondary);letter-spacing:.1em;text-transform:uppercase;font-weight:600;}
.sr-goal-panel-text strong{display:block;margin-top:4px;font-size:17px;line-height:1.35;font-weight:620;}
.sr-goal-panel-text p{margin:6px 0 0;font-size:10.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);}
.sr-goal-adjust{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding-top:12px;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);font-size:9.5px;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;}
.sr-goal-stepper-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:3px;}
.sr-goal-daily-avg{font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.75;white-space:nowrap;}
.sr-goal-stepper{display:flex;align-items:center;gap:1px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;overflow:hidden;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 72%,transparent);}
.sr-goal-stepper button{width:25px;height:24px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1;cursor:pointer;}
.sr-goal-stepper button:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);color:var(--dsw-alias-label-primary);}
.sr-goal-stepper button:disabled{opacity:.3;cursor:default;background:transparent;}
.sr-goal-stepper>span{min-width:54px;padding:0 4px;border-left:1px solid var(--dsw-alias-border-l1);border-right:1px solid var(--dsw-alias-border-l1);line-height:24px;text-align:center;font-size:9px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.sr-heatmap-panel{margin-top:16px;}
.sr-heatmap-weekdays,.sr-heatmap-grid{width:100%;max-width:560px;margin-left:auto;margin-right:auto;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;}
.sr-heatmap-period{display:flex;align-items:center;justify-content:center;gap:9px;margin:-2px 0 8px;font-size:8.5px;color:var(--dsw-alias-label-secondary);}
.sr-heat-nav{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-heat-nav:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);}
.sr-heat-nav:disabled{opacity:.25;cursor:default;}
.sr-heatmap-weekdays{margin-top:2px;margin-bottom:6px;text-align:center;font-size:8.5px;letter-spacing:.03em;color:var(--dsw-alias-label-secondary);opacity:.75;}
.sr-heatmap-grid{padding:1px;}
.sr-heat-cell,.sr-heat-blank{height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-variant-numeric:tabular-nums;}
.sr-heat-blank{background:transparent;}
.sr-heat-cell{
  appearance:none;border:0;padding:0;font:inherit;cursor:pointer;
  color:var(--dsw-alias-label-secondary);background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 68%,transparent);
  border:1px solid transparent;border-radius:6px;
  transition:transform .14s cubic-bezier(.16,1,.3,1),box-shadow .14s ease,background .14s ease;
}
.sr-heat-cell[data-selected="true"]{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.sr-heat-detail{margin-top:11px;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 58%,transparent);}
.sr-heat-cell[data-level="1"],.sr-heat-legend-swatch[data-level="1"]{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-2));}
.sr-heat-cell[data-level="2"],.sr-heat-legend-swatch[data-level="2"]{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 24%,var(--dsw-alias-bg-layer-2));}
.sr-heat-cell[data-level="3"],.sr-heat-legend-swatch[data-level="3"]{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 43%,var(--dsw-alias-bg-layer-2));}
.sr-heat-cell[data-level="4"],.sr-heat-legend-swatch[data-level="4"]{background:var(--dsw-alias-brand-primary);}
.sr-heat-cell[data-level="3"],.sr-heat-cell[data-level="4"]{color:var(--dsw-alias-bg-base);}
.sr-heat-cell[data-today="true"]{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 0 3.5px color-mix(in oklab,var(--dsw-alias-brand-primary) 55%,transparent);}
.sr-heat-cell:hover{
  transform:translateY(-2px) scale(1.04);
  box-shadow:0 6px 14px -5px rgba(0,0,0,.35);
  z-index:2;
}
.sr-heat-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 2px 7px;}
.sr-heat-detail-head>div{display:flex;align-items:baseline;gap:8px;min-width:0;}
.sr-heat-detail-head strong{font-family:${SERIF_FONT};font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-heat-detail-head span{font-size:9px;color:var(--dsw-alias-brand-primary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.sr-heat-detail-head .sr-icon-btn{width:25px;height:25px;flex:none;}
.sr-heat-detail-empty{margin:0;padding:8px 2px 11px;font-size:9.5px;color:var(--dsw-alias-label-secondary);opacity:.78;}
.sr-heat-detail-list{display:flex;flex-direction:column;gap:2px;}
.sr-heat-detail-row{appearance:none;display:flex;align-items:center;gap:7px;width:100%;padding:5px 4px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;cursor:pointer;}
.sr-heat-detail-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary);}
.sr-heat-detail-dot{width:18px;height:18px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);}
.sr-heat-detail-book{min-width:0;flex:1;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-heat-detail-time{flex:none;font-size:8.5px;font-variant-numeric:tabular-nums;opacity:.8;}
.sr-heatmap-legend{display:flex;align-items:center;justify-content:flex-end;gap:4px;width:100%;max-width:560px;margin:9px auto 0;font-size:8px;color:var(--dsw-alias-label-secondary);opacity:.8;}
.sr-heat-legend-swatch{display:inline-block;width:10px;height:10px;border-radius:3px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 68%,transparent);}
.sr-goal-panel-note{font-family:${SERIF_FONT};font-size:12px;line-height:1.75;color:var(--dsw-alias-label-secondary);border-top:1px dashed var(--dsw-alias-border-l1);padding-top:13px;}
.sr-rhythm-panel{margin-top:16px;}
.sr-rhythm-bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;align-items:end;padding-top:4px;}
.sr-rhythm-col{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;}
.sr-rhythm-value{height:12px;font-size:8px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.sr-rhythm-slot{display:flex;align-items:flex-end;justify-content:center;width:100%;height:74px;border-radius:4px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 45%,transparent);overflow:hidden;}
.sr-rhythm-bar{width:min(22px,64%);border-radius:3px 3px 0 0;background:var(--dsw-alias-brand-primary);opacity:.68;min-height:2px;}
.sr-rhythm-col:first-child .sr-rhythm-bar,.sr-rhythm-col:nth-child(2) .sr-rhythm-bar{opacity:.52;}
.sr-rhythm-col.is-peak .sr-rhythm-bar{background:var(--sr-accent-strong);opacity:1;}
.sr-rhythm-col.is-peak .sr-rhythm-label{color:var(--sr-accent-strong);font-weight:600;}
.sr-rhythm-peak-chip{color:var(--sr-accent-strong);border-color:color-mix(in oklab,var(--sr-accent-strong) 30%,transparent);}
.sr-rhythm-label{font-size:8px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.sr-tod-panel{margin-top:16px;}
.sr-tod-rows{display:flex;flex-direction:column;gap:9px;padding-top:2px;}
.sr-tod-row{display:grid;grid-template-columns:46px minmax(0,1fr) 64px 34px;align-items:center;gap:9px;}
.sr-tod-label{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.sr-tod-track{height:8px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 55%,transparent);overflow:hidden;}
.sr-tod-fill{height:100%;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-label-secondary) 48%,transparent);transition:width .2s ease;}
.sr-tod-row[data-peak="true"] .sr-tod-fill{background:var(--sr-accent-strong);}
.sr-tod-row[data-peak="true"] .sr-tod-label{color:var(--sr-accent-strong);font-weight:600;}
.sr-tod-time{font-size:10px;color:var(--dsw-alias-label-secondary);text-align:right;font-variant-numeric:tabular-nums;}
.sr-tod-pct{font-size:9px;color:var(--dsw-alias-label-secondary);text-align:right;opacity:.78;font-variant-numeric:tabular-nums;}
.sr-tod-empty{font-family:${SERIF_FONT};font-size:12px;line-height:1.75;color:var(--dsw-alias-label-secondary);margin:0;}
.sr-achievements-panel{margin-top:16px;}
.sr-achievements-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
.sr-achievement{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:7px;padding:10px 10px 9px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 68%,transparent);border-radius:10px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 34%,transparent);opacity:.66;transition:opacity .15s ease,border-color .15s ease,background .15s ease;}
.sr-achievement[data-unlocked="true"]{opacity:1;border-color:color-mix(in oklab,var(--dsw-alias-brand-primary) 30%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-brand-primary) 5%,var(--dsw-alias-bg-layer-1));}
.sr-achievement-icon{width:27px;height:27px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-secondary);}
.sr-achievement[data-unlocked="true"] .sr-achievement-icon{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary);}
.sr-achievement-copy{min-width:0;display:flex;flex-direction:column;gap:1px;}
.sr-achievement-copy strong{font-family:${SERIF_FONT};font-size:11.5px;line-height:1.35;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-achievement-copy span{font-size:8.5px;line-height:1.35;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-achievement-state{font-size:7.5px;line-height:1.2;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums;}
.sr-achievement[data-unlocked="true"] .sr-achievement-state{color:var(--dsw-alias-brand-primary);font-weight:600;}
.sr-achievement-progress{grid-column:1 / -1;margin-top:2px;}
.sr-achievement-track{display:block;height:2px;border-radius:2px;background:var(--dsw-alias-border-l1);overflow:hidden;}
.sr-achievement-fill{display:block;height:100%;border-radius:inherit;background:var(--dsw-alias-brand-primary);opacity:.65;}
.sr-achievement[data-unlocked="true"] .sr-achievement-fill{opacity:.95;}
.sr-taste-list{display:flex;flex-direction:column;gap:7px;padding-top:2px;}
.sr-taste-row{display:grid;grid-template-columns:minmax(52px,92px) minmax(0,1fr) auto;align-items:center;gap:9px;}
.sr-taste-name{font-size:9.5px;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-taste-bar{height:3px;border-radius:3px;background:color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);overflow:hidden;}
.sr-taste-bar span{display:block;height:100%;border-radius:inherit;background:var(--dsw-alias-brand-primary);opacity:.68;}
.sr-taste-time{font-size:8.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.sr-ranking-list{display:flex;flex-direction:column;gap:2px;}
.sr-ranking-row{display:flex;align-items:center;gap:10px;width:100%;padding:7px 5px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer;}
.sr-ranking-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-ranking-index{width:20px;flex:none;font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;opacity:.65;}
.sr-ranking-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px;}
.sr-ranking-main strong{font-family:${SERIF_FONT};font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-ranking-bar{display:block;height:2px;max-width:240px;border-radius:2px;background:var(--dsw-alias-border-l1);overflow:hidden;}
.sr-ranking-bar span{display:block;height:100%;border-radius:inherit;background:var(--dsw-alias-brand-primary);opacity:.7;}
.sr-ranking-time{flex:none;font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.sr-ranking-empty{padding:18px 0 9px;text-align:center;font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.78;}
.sr-session-list{display:flex;flex-direction:column;gap:2px;}
.sr-session-row{display:flex;align-items:center;gap:9px;width:100%;padding:8px 5px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer;}
.sr-session-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-session-dot{width:23px;height:23px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);color:var(--dsw-alias-label-secondary);}
.sr-session-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}
.sr-session-main strong{font-family:${SERIF_FONT};font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-session-main span{font-size:9px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.82;}
.sr-session-time{flex:none;font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;}
.sr-data-panel{margin-top:16px;border-color:color-mix(in oklab,var(--dsw-alias-state-error-primary) 18%,var(--dsw-alias-border-l1));}
.sr-data-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.sr-data-confirm{margin-top:11px;padding:11px 12px;border:1px solid color-mix(in oklab,var(--dsw-alias-state-error-primary) 22%,var(--dsw-alias-border-l1));border-radius:9px;background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 4%,transparent);}
.sr-data-confirm p{margin:0 0 9px;font-size:10px;line-height:1.6;color:var(--dsw-alias-label-secondary);}
.sr-data-confirm-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;}
.sr-recent-list{display:flex;flex-direction:column;gap:2px;}
.sr-recent-row{display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:9px;cursor:pointer;border:0;background:transparent;text-align:left;color:inherit;width:100%;}
.sr-recent-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-recent-meta{min-width:0;flex:1;}
.sr-recent-meta strong{display:block;font-family:${SERIF_FONT};font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-recent-meta span{display:block;margin-top:2px;font-size:10px;color:var(--dsw-alias-label-secondary);}
.sr-recent-bar{width:76px;flex:none;}
.sr-recent-track{height:2.5px;border-radius:3px;background:var(--dsw-alias-border-l1);overflow:hidden;}
.sr-recent-fill{height:100%;background:var(--dsw-alias-brand-primary);}
.sr-recent-pct{margin-top:3px;text-align:right;font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.sr-btn-icon-only{width:33px;padding:0;flex:none;}
.sr-paste-backdrop{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,13,12,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:sr-fade .15s ease;}
.sr-paste-card{width:min(560px,100%);max-height:calc(100vh - 48px);display:flex;flex-direction:column;overflow:hidden;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:18px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 28px 70px -28px rgba(0,0,0,.6);animation:sr-pop .17s ease;}
.sr-paste-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px;}
.sr-paste-head h2{margin:0;font-family:${SERIF_FONT};font-size:19px;font-weight:600;letter-spacing:.04em;}
.sr-paste-head p{margin:4px 0 0;font-size:10px;line-height:1.55;color:var(--dsw-alias-label-secondary);}
.sr-paste-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px;}
.sr-paste-fields label,.sr-paste-text{display:flex;flex-direction:column;gap:4px;font-size:9px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-secondary);text-transform:uppercase;min-width:0;}
.sr-paste-fields input{height:30px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:11.5px;outline:none;}
.sr-paste-fields input:focus,.sr-paste-text textarea:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);}
.sr-paste-text{flex:1;min-height:0;}
.sr-paste-text textarea{flex:1;min-height:180px;max-height:36vh;resize:vertical;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.7;outline:none;}
.sr-paste-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding-top:11px;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 66%,transparent);font-size:9px;color:var(--dsw-alias-label-secondary);opacity:.85;}
.sr-paste-actions{display:flex;align-items:center;gap:6px;flex:none;}
.sr-modal-backdrop{
  position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:28px;
  background:rgba(9,13,12,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  animation:sr-fade .16s ease;
}
.sr-detail{
  width:min(760px,100%);max-height:calc(100vh - 56px);display:flex;gap:0;overflow:hidden;
  border-radius:20px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:var(--dsw-alias-bg-layer-1);
  box-shadow:0 32px 84px -24px rgba(0,0,0,.65),0 0 0 1px color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);
  animation:sr-pop .19s cubic-bezier(.2,.75,.3,1);
}
.sr-detail-left{
  flex:0 0 282px;padding:30px 26px;display:flex;flex-direction:column;gap:17px;
  background:
    radial-gradient(100% 100% at 15% 0%,color-mix(in oklab,var(--dsw-alias-brand-primary) 7%,transparent),transparent 55%),
    color-mix(in oklab,var(--dsw-alias-bg-layer-2) 55%,var(--dsw-alias-bg-layer-1));
  border-right:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);
  overflow-y:auto;
}
.sr-detail-left .sr-cover{width:100%;max-width:178px;margin:0 auto;filter:drop-shadow(0 18px 24px rgba(0,0,0,.18));}
.sr-cover-actions{display:flex;align-items:center;justify-content:center;gap:2px;flex-wrap:wrap;margin-top:-4px;}
.sr-detail-finish{margin:6px auto 0;display:flex;justify-content:center;width:100%;font-size:9px;}
.sr-detail-restart{margin:4px auto 0;display:flex;justify-content:center;width:100%;font-size:9px;}
.sr-detail-meta{display:flex;flex-direction:column;gap:3px;min-width:0;text-align:center;}
.sr-detail-status-chip{
  align-self:center;display:inline-flex;align-items:center;height:20px;padding:0 9px;
  border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-label-primary) 7%,transparent);
  color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-sans);
  font-size:8.5px;font-weight:600;letter-spacing:.04em;white-space:nowrap;
  box-shadow:0 1px 3px rgba(0,0,0,.06);
}
.sr-detail-status-chip[data-status="reading"]{color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 12%,transparent);}
.sr-detail-status-chip[data-status="finished"]{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary));background:color-mix(in oklab,var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary)) 12%,transparent);}
.sr-detail-status-chip[data-status="wishlist"]{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-brand-primary));background:color-mix(in oklab,var(--dsw-alias-state-warning-primary,var(--dsw-alias-brand-primary)) 12%,transparent);}
.sr-detail-meta strong{font-family:${SERIF_FONT};font-size:17px;letter-spacing:.04em;overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;max-width:100%;}
.sr-detail-meta span{font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;word-break:break-word;max-width:100%;}
.sr-detail-progress{padding:13px;border-radius:10px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 74%,transparent);background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 58%,transparent);}
.sr-detail-progress-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:var(--dsw-alias-label-secondary);margin-bottom:7px;}
.sr-detail-progress-head strong{color:var(--dsw-alias-label-primary);font-size:11px;font-variant-numeric:tabular-nums;}
.sr-detail-estimate{display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px;margin-top:8px;padding-top:7px;border-top:1px dashed color-mix(in oklab,var(--dsw-alias-border-l1) 62%,transparent);font-size:9px;line-height:1.5;color:var(--dsw-alias-label-secondary);}
.sr-detail-estimate svg{flex:none;opacity:.6;}
.sr-detail-estimate-main{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;}
.sr-detail-estimate-sub{opacity:.78;}
.sr-detail-estimate-sub::before{content:'·';margin-right:5px;opacity:.6;}
.sr-detail-body{min-width:0;flex:1;display:flex;flex-direction:column;overflow:hidden;}
.sr-detail-head{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:20px 28px 0;}
.sr-detail-head-label{font-size:8px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);opacity:.7;margin-right:auto;white-space:nowrap;}
.sr-book-edit-form{display:flex;flex-direction:column;gap:10px;padding:12px 28px 13px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 74%,transparent);background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 50%,var(--dsw-alias-bg-layer-1));}
.sr-book-edit-fields{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:9px;}
.sr-book-edit-fields label{display:flex;flex-direction:column;gap:4px;min-width:0;font-size:9px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-secondary);text-transform:uppercase;}
.sr-book-edit-fields input{width:100%;height:30px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:11.5px;outline:none;}
.sr-book-edit-fields input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 13%,transparent);}
.sr-book-edit-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;}
.sr-detail-remove-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 28px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-state-error-primary) 18%,var(--dsw-alias-border-l1));background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 6%,var(--dsw-alias-bg-layer-1));font-size:10.5px;line-height:1.55;color:var(--dsw-alias-label-secondary);}
.sr-detail-remove-actions{display:flex;align-items:center;gap:6px;flex:none;}
.sr-detail-nav{display:flex;align-items:center;gap:3px;flex-wrap:wrap;padding:8px 28px 0;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 52%,transparent);}
.sr-detail-nav button{appearance:none;padding:5px 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:9.5px;letter-spacing:.03em;cursor:pointer;}
.sr-detail-nav button:hover{color:var(--dsw-alias-label-primary);background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);}
.sr-detail-nav button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.sr-detail-scroll{flex:1;overflow-y:auto;padding:17px 28px 0;min-height:0;}
.sr-tag-row{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px;}
.sr-tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:4px;background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-secondary);font-size:9.5px;letter-spacing:.03em;}
.sr-tag[data-accent="true"]{color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 10%,transparent);}
.sr-detail-bookstats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:0 0 16px;}
.sr-detail-bookstats>div{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;align-items:center;column-gap:6px;padding:8px 9px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 72%,transparent);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 42%,transparent);min-width:0;}
.sr-detail-bookstats svg{grid-row:1 / span 2;color:var(--dsw-alias-label-secondary);opacity:.7;}
.sr-detail-bookstats strong{font-size:11.5px;font-weight:600;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
.sr-detail-bookstats span{font-size:8px;color:var(--dsw-alias-label-secondary);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-detail-notes{margin:0 0 18px;}
.sr-detail-notes-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:7px;}
.sr-detail-notes-head .sr-detail-section-label{margin-bottom:0;}
.sr-detail-note{appearance:none;display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 9px;margin-bottom:5px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 66%,transparent);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 36%,transparent);color:inherit;text-align:left;cursor:pointer;transition:background .14s ease,border-color .14s ease;}
.sr-detail-note:hover{background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 64%,transparent);border-color:var(--dsw-alias-border-l2);}
.sr-detail-note-mark{width:2.5px;align-self:stretch;flex:none;border-radius:2px;background:var(--sr-hl,var(--dsw-alias-brand-primary));opacity:.8;}
.sr-detail-note-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}
.sr-detail-note-quote{font-family:${SERIF_FONT};font-size:11.5px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;color:var(--dsw-alias-label-primary);}
.sr-detail-note-thought{font-size:10px;line-height:1.55;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;}
.sr-detail-note small{font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-detail-notes-more{margin:4px 1px 0;font-size:9px;color:var(--dsw-alias-label-secondary);opacity:.72;}
.sr-detail-bookmark{appearance:none;display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 9px;margin-bottom:5px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 66%,transparent);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 34%,transparent);color:inherit;text-align:left;cursor:pointer;transition:background .14s ease,border-color .14s ease;}
.sr-detail-bookmark:hover{background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 62%,transparent);border-color:var(--dsw-alias-border-l2);}
.sr-detail-bookmark-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}
.sr-detail-bookmark-excerpt{font-family:${SERIF_FONT};font-size:11px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;color:var(--dsw-alias-label-primary);}
.sr-detail-bookmark small{font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-detail-review{margin:0 0 18px;padding:11px 12px 10px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);border-radius:10px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 30%,transparent);}
.sr-detail-review .sr-detail-notes-head{margin-bottom:6px;}
.sr-review-stars{display:flex;align-items:center;gap:3px;margin-bottom:7px;}
.sr-review-star{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:.55;}
.sr-review-star:hover{opacity:.9;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 7%,transparent);}
.sr-review-star[data-on="true"]{color:var(--dsw-alias-brand-primary);opacity:1;}
.sr-review-text{width:100%;min-height:66px;resize:vertical;padding:8px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 76%,transparent);color:var(--dsw-alias-label-primary);font-size:10.5px;line-height:1.65;outline:none;font-family:inherit;}
.sr-review-text:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--dsw-alias-brand-primary) 11%,transparent);}
.sr-review-actions{display:flex;justify-content:flex-end;margin-top:6px;}
.sr-detail-similar{margin:0 0 18px;}
.sr-detail-similar .sr-detail-section-label{margin-bottom:7px;}
.sr-similar-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
.sr-similar-card{appearance:none;display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;padding:5px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 64%,transparent);border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer;}
.sr-similar-card:hover{background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 52%,transparent);border-color:var(--dsw-alias-border-l2);}
.sr-similar-card .sr-cover{width:100%;margin:0;}
.sr-similar-title{font-family:${SERIF_FONT};font-size:9.5px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.sr-similar-author{font-size:8px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.sr-detail-sessions{margin:0 0 18px;}
.sr-detail-sessions .sr-detail-section-label{margin-bottom:5px;}
.sr-book-session-list{display:flex;flex-direction:column;gap:2px;}
.sr-book-session{appearance:none;display:flex;align-items:center;gap:6px;width:100%;min-width:0;padding:5px 6px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:9px;text-align:left;cursor:pointer;}
.sr-book-session:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary);}
.sr-book-session>svg{flex:none;opacity:.6;}
.sr-book-session-chapter{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-book-session-time{flex:none;font-variant-numeric:tabular-nums;color:var(--dsw-alias-brand-primary);}
.sr-book-session small{flex:none;font-size:8px;opacity:.7;font-variant-numeric:tabular-nums;}
.sr-detail-desc{margin:0 0 18px;font-size:12.5px;line-height:1.85;color:var(--dsw-alias-label-secondary);}
.sr-detail-section-label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 7px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.sr-detail-section-label span{font-size:9.5px;font-weight:400;text-transform:none;letter-spacing:.03em;opacity:.8;}
.sr-detail-chapters-head{flex-wrap:wrap;}
.sr-detail-chapter-search{
  display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:6px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 40%,transparent);
  color:var(--dsw-alias-label-secondary);
}
.sr-detail-chapter-search:focus-within{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary);}
.sr-detail-chapter-search input{
  width:96px;padding:0;border:0;background:transparent;color:inherit;font-size:9.5px;outline:none;
}
.sr-detail-no-chapters{padding:14px 4px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center;font-style:italic;}
.sr-chapter-list{border-top:1px solid var(--dsw-alias-border-l1);margin-bottom:4px;}
.sr-chapter-row{
  display:flex;align-items:center;gap:10px;width:100%;padding:9px 5px;border:0;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 60%,transparent);
  background:transparent;text-align:left;color:inherit;cursor:pointer;border-radius:0;
}
.sr-chapter-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 4%,transparent);}
.sr-chapter-num{width:18px;flex:none;font-size:9.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;opacity:.7;display:inline-flex;align-items:center;justify-content:center;}
.sr-chapter-name{min-width:0;flex:1;font-family:${SERIF_FONT};font-size:12px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sr-chapter-row[data-current="true"] .sr-chapter-name{color:var(--dsw-alias-brand-primary);font-weight:600;}
.sr-chapter-row[data-current="true"] .sr-chapter-num{color:var(--dsw-alias-brand-primary);opacity:1;}
.sr-chapter-row[data-read="true"] .sr-chapter-num{color:var(--dsw-alias-label-secondary);opacity:.55;}
.sr-chapter-row[data-read="true"] .sr-chapter-name{opacity:.82;}
.sr-chapter-dot{width:4px;height:4px;border-radius:50%;background:var(--dsw-alias-brand-primary);flex:none;}
.sr-chapter-row-meta{display:inline-flex;align-items:center;gap:6px;flex:none;}
.sr-chapter-badge{display:inline-flex;align-items:center;gap:2.5px;font-size:8.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;opacity:.8;}
.sr-chapter-min{font-size:9px;color:var(--dsw-alias-label-secondary);opacity:.68;font-variant-numeric:tabular-nums;}
.sr-chapter-percent{font-size:9px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;opacity:.75;}
.sr-detail-foot{
  flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:15px 28px 20px;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 68%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 92%,transparent);
}
.sr-detail-foot-info{font-size:10.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sr-detail-actions{display:flex;align-items:center;gap:8px;flex:none;}
@keyframes sr-fade{from{opacity:0;}to{opacity:1;}}
@keyframes sr-pop{from{opacity:0;transform:translateY(7px) scale(.985);}to{opacity:1;transform:none;}}
@keyframes sr-rise{from{opacity:0;transform:translate(-50%,9px);}to{opacity:1;transform:translate(-50%,0);}}
@keyframes sr-corner-up{from{opacity:0;transform:translateY(12px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes sr-corner-down{from{opacity:0;transform:translateY(-12px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes sr-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.sr-spin{animation:sr-spin 1.2s linear infinite;}
@keyframes sr-sheet-up{from{opacity:0;transform:translate(-50%,18px);}to{opacity:1;transform:translate(-50%,0);}}
.sr-palette-trigger{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border-radius:8px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 92%,transparent);background:transparent;color:var(--dsw-alias-label-secondary);font-size:10.5px;cursor:pointer;transition:background .14s ease,color .14s ease,border-color .14s ease;}
.sr-palette-trigger:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-palette-trigger svg{opacity:.75;flex:none;}
.sr-palette-trigger kbd,.sr-palette-field kbd,.sr-palette-foot kbd{
  font:inherit;font-family:var(--dsw-font-mono,ui-monospace,monospace);
  font-size:9.5px;letter-spacing:.02em;padding:2px 6px;border-radius:5px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 88%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);
  color:var(--dsw-alias-label-secondary);box-shadow:0 1px 2px rgba(0,0,0,.06);
}
.sr-palette-backdrop{
  position:fixed;inset:0;z-index:320;display:flex;align-items:flex-start;justify-content:center;
  padding:12vh 18px 24px;background:rgba(8,12,14,.48);
  backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);
  animation:sr-fade .12s ease;
}
.sr-palette{
  width:min(560px,100%);max-height:min(540px,74vh);display:flex;flex-direction:column;overflow:hidden;
  border-radius:18px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 92%,transparent);
  box-shadow:0 34px 80px -20px rgba(0,0,0,.65),0 2px 10px rgba(0,0,0,.08);
  backdrop-filter:blur(28px) saturate(1.4);-webkit-backdrop-filter:blur(28px) saturate(1.4);
  animation:sr-pop .18s cubic-bezier(.16,1,.3,1);
}
.sr-palette-field{display:flex;align-items:center;gap:9px;padding:13px 15px;border-bottom:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);}
.sr-palette-field>svg{flex:none;opacity:.55;}
.sr-palette-field input{flex:1;min-width:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.4;outline:none;}
.sr-palette-field input::placeholder{color:var(--dsw-alias-label-secondary);}
.sr-palette-field input:focus-visible{outline:none;}
.sr-palette-body{flex:1;min-height:0;overflow-y:auto;padding:6px 7px 9px;}
.sr-palette-group+.sr-palette-group{margin-top:4px;}
.sr-palette-group-label{padding:8px 9px 3px;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);opacity:.62;}
.sr-palette-row{display:flex;align-items:center;gap:9px;width:100%;padding:7px 9px;border-radius:9px;text-align:left;color:var(--dsw-alias-label-primary);cursor:pointer;transition:background .1s ease;}
.sr-palette-row[data-active="true"]{background:color-mix(in oklab,var(--sr-accent-strong) 30%,transparent);}
.sr-palette-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:7px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 88%,transparent);color:var(--dsw-alias-label-secondary);}
.sr-palette-row[data-active="true"] .sr-palette-icon{color:#f4efe4;border-color:transparent;background:var(--sr-accent-strong);}
.sr-palette-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.sr-palette-label{font-size:11.5px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-palette-meta{font-size:9px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-palette-kind{flex:none;font-size:8.5px;color:var(--dsw-alias-label-secondary);opacity:.55;}
.sr-palette-empty{display:flex;flex-direction:column;align-items:center;gap:9px;padding:34px 14px;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.sr-palette-empty svg{opacity:.35;}
.sr-palette-foot{display:flex;align-items:center;gap:14px;padding:8px 15px;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 78%,transparent);font-size:9px;color:var(--dsw-alias-label-secondary);}
.sr-palette-foot span{display:inline-flex;align-items:center;gap:3px;}
@media (max-width:900px){.sr-palette-trigger-label{display:none;}}
@media (max-width:760px){.sr-palette-backdrop{padding:8px;}.sr-palette{max-height:calc(100vh - 16px);}.sr-palette-foot{display:none;}}

.sr-import-progress{
  position:absolute;top:calc(100% + 8px);left:0;z-index:210;
  width:290px;max-width:calc(100vw - 28px);padding:11px 13px 10px;
  border:1px solid var(--dsw-alias-border-l1);border-radius:12px;
  background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);
  box-shadow:0 16px 38px -10px rgba(0,0,0,.42),0 0 0 1px color-mix(in oklab,var(--dsw-alias-brand-primary) 14%,transparent);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  pointer-events:auto;animation:sr-corner-down .18s cubic-bezier(0.16,1,0.3,1);
}
.sr-import-progress-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;}
.sr-import-progress-title-wrap{display:inline-flex;align-items:center;gap:6px;min-width:0;}
.sr-import-progress-title-wrap svg{color:var(--dsw-alias-brand-primary);flex:none;}
.sr-import-progress-head strong{font-size:11.5px;font-weight:650;letter-spacing:.02em;white-space:nowrap;}
.sr-import-progress-count{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:10.5px;}
.sr-import-progress-btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;border:0;border-radius:5px;
  background:transparent;color:var(--dsw-alias-label-secondary);
  cursor:pointer;transition:all .14s ease;padding:0;
}
.sr-import-progress-btn:hover{
  background:color-mix(in oklab,var(--dsw-alias-label-primary) 8%,transparent);
  color:var(--dsw-alias-label-primary);
}
.sr-import-progress-track{height:4px;margin:7px 0 6px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-label-primary) 9%,transparent);overflow:hidden;}
.sr-import-progress-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--dsw-alias-brand-primary),color-mix(in oklab,var(--dsw-alias-brand-primary) 58%,var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary))));transition:width .18s ease;}
.sr-import-progress-file{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:var(--dsw-alias-label-secondary);}
.sr-import-progress-stats{margin-top:3px;font-size:9.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.sr-import-progress-hint{margin-top:3px;font-size:9px;line-height:1.45;color:color-mix(in oklab,var(--dsw-alias-label-secondary) 75%,transparent);}
.sr-toast{
  position:fixed;left:50%;bottom:28px;z-index:220;transform:translateX(-50%);
  display:inline-flex;align-items:center;gap:10px;max-width:min(520px,calc(100vw - 32px));
  padding:8px 18px;border-radius:999px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);
  background:color-mix(in oklab,var(--dsw-alias-bg-overlay) 92%,transparent);
  color:var(--dsw-alias-label-primary);
  box-shadow:0 16px 42px -12px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.08);
  font-size:12px;line-height:1.45;font-weight:550;
  animation:sr-rise .2s cubic-bezier(.16,1,.3,1);
  backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
}
.sr-toast svg{color:var(--dsw-alias-state-success-primary);flex:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.2));}
.sr-toast-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-toast-action{
  border:0;border-radius:999px;padding:3px 10px;
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 15%,transparent);
  color:var(--dsw-alias-brand-primary);font:inherit;font-size:11px;font-weight:600;
  cursor:pointer;white-space:nowrap;transition:all .14s ease;
}
.sr-toast-action:hover{
  background:color-mix(in oklab,var(--dsw-alias-brand-primary) 25%,transparent);
  transform:scale(1.04);
}

.sr-shell{position:relative;}
.sr-drop-overlay{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;pointer-events:none;background:color-mix(in oklab,var(--dsw-alias-bg-base) 55%,transparent);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:sr-fade .13s ease;}
.sr-drop-card{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:min(340px,calc(100vw - 48px));padding:30px 38px;border:2px dashed color-mix(in oklab,var(--dsw-alias-brand-primary) 52%,var(--dsw-alias-border-l2));border-radius:18px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 30px 80px -34px rgba(0,0,0,.5);text-align:center;}
.sr-drop-card svg{color:var(--dsw-alias-brand-primary);opacity:.85;margin-bottom:3px;}
.sr-drop-card strong{font-family:${SERIF_FONT};font-size:16px;font-weight:600;letter-spacing:.04em;}
.sr-drop-card span{font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.sr-reader{
  position:relative;width:100%;height:100%;flex:1;min-height:0;overflow:hidden;
  background:var(--sr-bg);color:var(--sr-ink);
  --sr-bg:#f3ede2;--sr-panel:#faf5eb;--sr-ink:#322920;--sr-muted:#867763;--sr-line:rgba(94,73,48,.14);--sr-accent:#9c6a36;--sr-wash:rgba(156,106,54,.12);
  transition:background .25s ease,color .25s ease;
  isolation:isolate;
  box-sizing:border-box;
}
.sr-reader:fullscreen,
.sr-reader:-webkit-full-screen{
  width:100vw !important;
  height:100vh !important;
  background:var(--sr-bg) !important;
}
.sr-reader::before{
  content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.32;
  background-image:radial-gradient(color-mix(in srgb,var(--sr-ink) 7%,transparent) .6px,transparent .8px);
  background-size:20px 20px;
  -webkit-mask-image:radial-gradient(110% 100% at 50% 40%,#000 30%,transparent 100%);
  mask-image:radial-gradient(110% 100% at 50% 40%,#000 30%,transparent 100%);
}
.sr-reader[data-theme="paper"]{--sr-bg:#f3ede2;--sr-panel:#faf5eb;--sr-ink:#322920;--sr-muted:#867763;--sr-line:rgba(94,73,48,.14);--sr-accent:#9c6a36;--sr-wash:rgba(156,106,54,.12);}
.sr-reader[data-theme="candle"]{--sr-bg:#f4e6ce;--sr-panel:#faeedc;--sr-ink:#3e2918;--sr-muted:#8f7051;--sr-line:rgba(90,56,22,.14);--sr-accent:#ad6b2a;--sr-wash:rgba(173,107,42,.14);}
.sr-reader[data-theme="candle"]::before{opacity:.22;}
.sr-reader[data-theme="snow"]{--sr-bg:#f8f7f4;--sr-panel:#ffffff;--sr-ink:#292825;--sr-muted:#848077;--sr-line:rgba(62,60,54,.11);--sr-accent:#467268;--sr-wash:rgba(70,114,104,.1);}
.sr-reader[data-theme="mint"]{--sr-bg:#e6eee4;--sr-panel:#f1f6ef;--sr-ink:#273428;--sr-muted:#6b7c69;--sr-line:rgba(50,72,52,.13);--sr-accent:#4a744b;--sr-wash:rgba(74,116,75,.12);}
.sr-reader[data-theme="forest"]{--sr-bg:#121c18;--sr-panel:#1a2721;--sr-ink:#c3d6cc;--sr-muted:#769183;--sr-line:rgba(180,210,195,.12);--sr-accent:#65a982;--sr-wash:rgba(101,169,130,.14);}
.sr-reader[data-theme="forest"]::before{opacity:.16;}
.sr-reader[data-theme="night"]{--sr-bg:#151a1d;--sr-panel:#1d2529;--sr-ink:#c9c3b7;--sr-muted:#7e8784;--sr-line:rgba(206,198,181,.12);--sr-accent:#cbb07a;--sr-wash:rgba(203,176,122,.12);}
.sr-reader[data-theme="night"]::before{opacity:.18;}
.sr-reader[data-theme="oled"]{--sr-bg:#000000;--sr-panel:#0d0d0e;--sr-ink:#b8b5ab;--sr-muted:#73736c;--sr-line:rgba(255,255,255,.1);--sr-accent:#c49d64;--sr-wash:rgba(196,157,100,.14);}
.sr-reader[data-theme="oled"]::before{display:none;}
.sr-reader[data-theme="eink"]{--sr-bg:#ffffff;--sr-panel:#ffffff;--sr-ink:#000000;--sr-muted:#444444;--sr-line:rgba(0,0,0,.22);--sr-accent:#000000;--sr-wash:rgba(0,0,0,.08);}
.sr-reader[data-theme="eink"]::before{display:none;}
.sr-reader[data-theme="eink"] *{text-shadow:none !important;box-shadow:none !important;transition:none !important;animation:none !important;}
.sr-card-theme[data-theme="oled"] .sr-card-theme-dot{background:#000000;border:1px solid rgba(255,255,255,.25);}
.sr-reader ::selection{background:color-mix(in srgb,var(--sr-accent) 26%,transparent);}
.sr-reader-top{
  position:absolute;z-index:14;top:0;left:0;right:0;height:56px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:0 clamp(16px,2.8vw,32px);
  background:color-mix(in srgb,var(--sr-panel) 84%,transparent);
  backdrop-filter:blur(24px) saturate(1.2);
  -webkit-backdrop-filter:blur(24px) saturate(1.2);
  border-bottom:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  box-shadow:0 4px 18px -10px rgba(0,0,0,.08);
  -webkit-app-region:drag;
  transition:opacity .22s cubic-bezier(.16,1,.3,1),transform .22s cubic-bezier(.16,1,.3,1);
}
.sr-reader-slim-progress{
  position:fixed;top:0;left:0;height:2.5px;
  background:linear-gradient(90deg,var(--sr-accent),color-mix(in srgb,var(--sr-accent) 70%,#fff));
  box-shadow:0 1px 4px color-mix(in srgb,var(--sr-accent) 35%,transparent);
  opacity:.85;z-index:60;transition:width .22s cubic-bezier(.16,1,.3,1);pointer-events:none;
}
.sr-reader-slim-progress::after{
  content:"";position:absolute;right:0;top:-1.5px;width:5px;height:5.5px;border-radius:50%;
  background:#fff;box-shadow:0 0 8px 1.5px var(--sr-accent);
}
.sr-reader-top.is-hidden{opacity:0;transform:translateY(-8px);pointer-events:none;}
.sr-reader-top :where(button,a,input,.sr-reader-top-left,.sr-reader-top-center,.sr-reader-top-right,.sr-font-anchor){
  -webkit-app-region:no-drag;
}
.sr-reader-top-left{display:flex;align-items:center;gap:6px;flex:none;}
.sr-reader-top-right{
  display:flex;align-items:center;gap:2px;flex:none;
  padding:3px;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  background:color-mix(in srgb,var(--sr-ink) 4%,transparent);
  transition:background-color .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.sr-reader-top-right:hover{
  background:color-mix(in srgb,var(--sr-ink) 6.5%,transparent);
  border-color:color-mix(in srgb,var(--sr-line) 95%,transparent);
}
.sr-reader-top-center{
  min-width:0;flex:1;display:flex;align-items:center;justify-content:center;
  max-width:min(520px,50vw);margin:0 auto;
  padding:2px 3px;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  background:color-mix(in srgb,var(--sr-ink) 4%,transparent);
  transition:background-color .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.sr-reader-top-center:hover{
  background:color-mix(in srgb,var(--sr-ink) 6.5%,transparent);
  border-color:color-mix(in srgb,var(--sr-line) 95%,transparent);
}
.sr-reader-top-center-copy{
  min-width:0;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.25;
  background:transparent;border:0;padding:2px 10px;border-radius:999px;cursor:pointer;
  color:inherit;font:inherit;text-align:center;transition:background-color .15s ease,opacity .15s ease;
}
button.sr-reader-top-center-copy:hover{background:color-mix(in srgb,var(--sr-panel) 80%,transparent);}
.sr-chapter-nav{
  width:26px;height:26px;flex:none;display:inline-flex;align-items:center;justify-content:center;
  padding:0;border:0;border-radius:50%;background:transparent;color:var(--sr-muted);cursor:pointer;
  transition:all .14s ease;
}
.sr-chapter-nav:hover:not(:disabled){
  color:var(--sr-ink);background:color-mix(in srgb,var(--sr-panel) 90%,transparent);box-shadow:0 1px 2px rgba(0,0,0,.08);
}
.sr-chapter-nav:disabled{opacity:.22;cursor:default;}
.sr-reader-top-center small{
  font-family:${UI_FONT};font-size:9.5px;font-weight:550;letter-spacing:.08em;
  text-transform:uppercase;color:var(--sr-muted);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.sr-reader-top-center strong{
  font-family:${SERIF_FONT};font-size:13px;font-weight:600;letter-spacing:.03em;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sr-ink);
}
.sr-reader-back{
  display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px 0 9px;
  border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;
  background:color-mix(in srgb,var(--sr-panel) 65%,transparent);color:var(--sr-muted);
  cursor:pointer;font-family:${UI_FONT};font-size:12px;font-weight:550;letter-spacing:.02em;
  transition:all .15s ease;
}
.sr-reader-back:hover{
  color:var(--sr-ink);background:var(--sr-panel);
  border-color:color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));
  box-shadow:0 2px 6px -2px rgba(0,0,0,.12);
}
.sr-reader-back:active{transform:translateY(1px);}
.sr-jump-return{
  display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px 0 9px;
  border-radius:999px;border:1px solid color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));
  background:var(--sr-wash);color:var(--sr-accent);font-family:${UI_FONT};
  font-size:11.5px;font-weight:600;cursor:pointer;transition:all .14s ease;animation:sr-fade .15s ease;
}
.sr-jump-return:hover{background:color-mix(in srgb,var(--sr-accent) 22%,transparent);transform:scale(1.02);}
.sr-jump-return:focus-visible{outline:2px solid var(--sr-accent);outline-offset:2px;}
.sr-reader-icon{
  display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;
  border:0;border-radius:999px;background:transparent;color:var(--sr-muted);cursor:pointer;
  transition:all .14s ease;
}
.sr-reader-icon:hover{
  background:color-mix(in srgb,var(--sr-panel) 90%,transparent);color:var(--sr-ink);
  box-shadow:0 1px 2px rgba(0,0,0,.08);
}
.sr-reader-icon[data-on="true"]{
  color:var(--sr-accent);background:var(--sr-wash);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sr-accent) 30%,transparent);
}
.sr-reader-icon:focus-visible,.sr-reader-back:focus-visible{outline:2px solid var(--sr-accent);outline-offset:2px;}
.sr-font-anchor{position:relative;display:inline-flex;flex:none;}
.sr-font-trigger{font-family:${SERIF_FONT};}
.sr-font-glyph{font-size:13px;font-weight:600;letter-spacing:.02em;line-height:1;}
.sr-font-quick{
  position:absolute;top:calc(100% + 8px);right:0;z-index:30;
  display:flex;flex-direction:column;gap:8px;width:164px;padding:9px;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:13px;
  background:color-mix(in srgb,var(--sr-panel) 94%,transparent);
  color:var(--sr-ink);box-shadow:0 18px 40px -12px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
  animation:sr-fade .14s ease;
}
.sr-font-quick::before{
  content:"";position:absolute;top:-5px;right:12px;width:8px;height:8px;
  background:color-mix(in srgb,var(--sr-panel) 94%,transparent);
  border-left:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  border-top:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  transform:rotate(45deg);
}
.sr-font-quick-row{display:flex;align-items:center;gap:5px;}
.sr-font-step{
  width:30px;height:29px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:8px;background:transparent;color:var(--sr-muted);cursor:pointer;
  transition:all .14s ease;
}
.sr-font-step:hover:not(:disabled){color:var(--sr-ink);background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent) 35%,var(--sr-line));}
.sr-font-step:disabled{opacity:.28;cursor:default;}
.sr-font-step:focus-visible,.sr-font-quick-link:focus-visible{outline:2px solid var(--sr-accent);outline-offset:1px;}
.sr-font-quick-value{
  flex:1;text-align:center;font-family:${UI_FONT};font-size:11.5px;font-weight:600;
  letter-spacing:.04em;font-variant-numeric:tabular-nums;color:var(--sr-ink);
}
.sr-font-quick-foot{display:flex;align-items:center;gap:4px;padding-top:4px;border-top:1px solid color-mix(in srgb,var(--sr-line) 65%,transparent);}
.sr-font-quick-link{
  flex:1;height:24px;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  border:0;border-radius:6px;background:transparent;color:var(--sr-muted);cursor:pointer;
  font-family:${UI_FONT};font-size:10px;font-weight:500;letter-spacing:.02em;transition:all .14s ease;
}
.sr-font-quick-link:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 7%,transparent);}
.sr-font-hud{
  position:absolute;z-index:70;left:50%;top:clamp(62px,8vh,88px);transform:translateX(-50%);
  display:flex;align-items:baseline;gap:6px;padding:6px 14px;pointer-events:none;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:999px;
  background:color-mix(in srgb,var(--sr-panel) 92%,transparent);color:var(--sr-ink);
  box-shadow:0 14px 34px -14px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.08);
  backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);
  animation:sr-hud-in .18s cubic-bezier(.16,1,.3,1);
}
.sr-font-hud-glyph{font-family:${SERIF_FONT};font-size:12px;color:var(--sr-muted);}
.sr-font-hud strong{font-family:${UI_FONT};font-size:11px;font-weight:600;letter-spacing:.06em;font-variant-numeric:tabular-nums;}
.sr-chapter-hud{
  position:absolute;z-index:70;left:50%;top:clamp(62px,8vh,88px);transform:translateX(-50%);
  display:inline-flex;align-items:center;gap:10px;padding:7px 16px;pointer-events:none;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:999px;max-width:min(90vw,500px);
  background:color-mix(in srgb,var(--sr-panel) 92%,transparent);color:var(--sr-ink);
  box-shadow:0 16px 38px -12px rgba(0,0,0,.35),0 2px 8px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
  animation:sr-hud-in .2s cubic-bezier(.16,1,.3,1);white-space:nowrap;overflow:hidden;
}
.sr-chapter-hud-index{
  font-family:${UI_FONT};font-size:10px;color:var(--sr-accent,var(--dsw-alias-primary));
  font-weight:700;letter-spacing:.04em;flex:none;padding:2px 7px;
  background:color-mix(in srgb,var(--sr-accent,var(--dsw-alias-primary)) 12%,transparent);
  border-radius:999px;
}
.sr-chapter-hud strong{font-family:${SERIF_FONT};font-size:12.5px;font-weight:600;letter-spacing:.03em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
@keyframes sr-hud-in{from{opacity:0;transform:translate(-50%,-6px) scale(.98);}to{opacity:1;transform:translate(-50%,0) scale(1);}}
.sr-page-area{
  position:absolute;inset:0;z-index:2;
  width:100%;box-sizing:border-box;
  padding:83px clamp(30px,7vw,96px) 77px;
}
[data-theme="night"] .sr-page-area::before,
[data-theme="oled"] .sr-page-area::before{
  content:"";position:absolute;inset:0;pointer-events:none;z-index:15;
  background:radial-gradient(ellipse at center, transparent 72%, rgba(0,0,0,0.28) 100%);
  opacity:.5;
}
.sr-page-edge{
  position:absolute;top:50%;transform:translateY(-50%);z-index:10;
  display:inline-flex;align-items:center;justify-content:center;
  width:32px;height:32px;padding:0;border-radius:50%;
  border:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);
  background:color-mix(in srgb,var(--sr-panel) 82%,transparent);
  color:var(--sr-muted);cursor:pointer;
  box-shadow:0 4px 16px -4px rgba(0,0,0,.15);
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  opacity:0;transition:opacity .22s ease,transform .16s ease,background .16s ease,color .16s ease;
  pointer-events:none;
}
.sr-page-edge--prev{left:max(10px,env(safe-area-inset-left));}
.sr-page-edge--next{right:max(10px,env(safe-area-inset-right));}
.sr-page-area:hover .sr-page-edge:not(:disabled){opacity:.38;pointer-events:auto;}
.sr-page-edge:hover:not(:disabled){
  opacity:1 !important;transform:translateY(-50%) scale(1.08);
  background:var(--sr-panel);color:var(--sr-ink);
  box-shadow:0 6px 20px -4px rgba(0,0,0,.25);
  pointer-events:auto;
}
.sr-page-edge:active:not(:disabled){transform:translateY(-50%) scale(.96);}
.sr-page-edge:focus-visible{opacity:1 !important;outline:2px solid var(--sr-accent);outline-offset:2px;pointer-events:auto;}
.sr-page-edge:disabled{opacity:0 !important;pointer-events:none;}
.sr-stage{position:relative;height:100%;width:100%;max-width:860px;margin:0 auto;overflow:hidden;touch-action:pan-y;}
.sr-reading-ruler{
  position:absolute;left:0;right:0;pointer-events:none;z-index:22;
  height:calc(19px * 2.2);transform:translateY(-50%);
  background:color-mix(in srgb,var(--sr-accent) 10%,transparent);
  border-top:1.5px solid color-mix(in srgb,var(--sr-accent) 45%,transparent);
  border-bottom:1.5px solid color-mix(in srgb,var(--sr-accent) 45%,transparent);
  box-shadow:0 0 16px -2px color-mix(in srgb,var(--sr-accent) 22%,transparent), 0 0 0 9999px rgba(0,0,0,.08);
  transition:top .08s ease-out;
}
.sr-reader[data-page-width="compact"] .sr-stage{max-width:680px;}
.sr-reader[data-page-width="comfortable"] .sr-stage{max-width:860px;}
.sr-reader[data-page-width="wide"] .sr-stage{max-width:1040px;}
.sr-reader[data-page-width="full"] .sr-stage{max-width:none;width:100%;}
.sr-stage::after{display:none;}
.sr-page-bookmark-ribbon{
  position:absolute;top:0;right:28px;z-index:25;
  width:20px;height:34px;padding:0;border:0;
  background:linear-gradient(180deg,var(--sr-accent),color-mix(in srgb,var(--sr-accent) 84%,#000));
  clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 7px),0 100%);
  cursor:pointer;
  box-shadow:0 3px 8px rgba(0,0,0,.22);
  transition:transform .16s ease,filter .16s ease;
  animation:sr-ribbon-drop .22s cubic-bezier(.16,1,.3,1);
}
.sr-page-bookmark-ribbon:hover{
  transform:translateY(3px) scale(1.06);
  filter:brightness(1.08);
}
.sr-page-bookmark-ribbon--noted::after{
  content:"";position:absolute;top:7px;left:50%;transform:translateX(-50%);
  width:4px;height:4px;border-radius:50%;
  background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.35);
}
@keyframes sr-ribbon-drop{
  from{transform:translateY(-100%);opacity:0;}
  to{transform:translateY(0);opacity:1;}
}
.sr-page-track{display:block;height:100%;transform:translate3d(0,0,0);will-change:transform;transition:transform .27s cubic-bezier(.22,.8,.26,1);}
.sr-page-track[data-instant="true"]{transition:none;}
.sr-columns{
  column-fill:auto;column-gap:56px;height:100%;white-space:normal;
  font-family:${SERIF_FONT};font-size:19px;line-height:1.95;text-align:var(--sr-align,justify);
  color:var(--sr-ink);letter-spacing:var(--sr-letter-spacing,.02em);
  hanging-punctuation:first allow-end last;
  hyphens:auto;-webkit-hyphens:auto;
}
.sr-columns[data-font="sans"]{font-family:${UI_FONT};letter-spacing:var(--sr-letter-spacing,.02em);}
.sr-columns[data-font="kai"]{font-family:"Kaiti SC","STKaiti","KaiTi","Noto Serif SC",serif;letter-spacing:calc(var(--sr-letter-spacing,.02em) + .02em);line-height:calc(var(--sr-line-height,1.95) * 1.03);}
.sr-columns[data-font="dyslexic"]{font-family:"OpenDyslexic","Comic Sans MS","PingFang SC Medium",system-ui,sans-serif;letter-spacing:calc(var(--sr-letter-spacing,.02em) + .04em);word-spacing:.16em;line-height:calc(var(--sr-line-height,1.95) * 1.08);}
.sr-columns[data-font="system"]{font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:var(--sr-letter-spacing,.02em);}
.sr-chapter-head{break-after:avoid;margin:0 0 1.45em;padding-bottom:1.15em;border-bottom:1px solid color-mix(in srgb,var(--sr-line) 65%,transparent);}
.sr-chapter-kicker{
  display:inline-flex;align-items:center;gap:8px;font-family:${UI_FONT};font-size:9.5px;
  font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--sr-accent);margin-bottom:.75em;
}
.sr-chapter-kicker::after{
  content:"";display:inline-block;width:24px;height:1px;background:color-mix(in srgb,var(--sr-accent) 45%,transparent);
}
.sr-chapter-title{display:block;font-family:${SERIF_FONT};font-size:1.75em;line-height:1.36;font-weight:600;letter-spacing:.05em;color:var(--sr-ink);margin:0;text-align:left;}
.sr-columns p{margin:0 0 var(--sr-para-gap,.9em);text-indent:2em;white-space:pre-wrap;overflow-wrap:anywhere;orphans:2;widows:2;text-align:var(--sr-align,justify);}
.sr-columns p:first-of-type{text-indent:2em;}
.sr-columns p:first-of-type::first-letter{font-weight:600;color:var(--sr-ink);}
.sr-columns p.sr-verse{
  text-align:center;text-indent:0;letter-spacing:calc(var(--sr-letter-spacing,.02em) + .02em);
  line-height:2.02;margin:calc(var(--sr-para-gap,.9em) * 1.1) 0;
  color:color-mix(in srgb,var(--sr-ink) 95%,transparent);
}
.sr-columns p.sr-quote{
  text-indent:0;margin:calc(var(--sr-para-gap,.9em) * 1.15) 0;
  padding:.35em .8em .35em 1.1em;border-left:3px solid var(--sr-accent,var(--dsw-alias-primary));
  background:color-mix(in srgb,var(--sr-ink) 3.5%,transparent);border-radius:0 6px 6px 0;
  font-size:.97em;line-height:1.75;color:color-mix(in srgb,var(--sr-ink) 92%,transparent);
}
.sr-columns p.sr-pullquote{
  text-indent:0;margin:calc(var(--sr-para-gap,.9em) * 1.4) 0;
  padding:.7em 1.2em;border-radius:10px;
  background:color-mix(in srgb,var(--sr-accent) 6%,transparent);
  border:1px solid color-mix(in srgb,var(--sr-accent) 22%,transparent);
  font-family:${SERIF_FONT};font-size:1.15em;line-height:1.75;font-weight:550;
  color:var(--sr-ink);text-align:center;break-inside:avoid;
}
.sr-columns p.sr-divider{
  text-align:center;text-indent:0;margin:calc(var(--sr-para-gap,.9em) * 1.5) 0;
  color:var(--sr-muted);font-family:${SERIF_FONT};font-size:1.15em;letter-spacing:.45em;opacity:.72;
  break-inside:avoid;
}
.sr-columns p.sr-subheading,
.sr-columns h2,.sr-columns h3,.sr-columns h4,.sr-columns h5,.sr-columns h6{
  font-family:${SERIF_FONT};font-size:1.24em;line-height:1.42;font-weight:600;
  letter-spacing:.04em;color:var(--sr-ink);text-indent:0;
  margin:1.4em 0 .5em;break-after:avoid;break-inside:avoid;
}
.sr-columns h2{font-size:1.35em;}
.sr-columns h3{font-size:1.22em;}
.sr-columns h4{font-size:1.1em;}
.sr-columns hr{
  border:none;margin:calc(var(--sr-para-gap,.9em) * 1.5) 0;
  text-align:center;height:auto;overflow:visible;
  break-inside:avoid;text-indent:0;
}
.sr-columns hr::before{
  content:"❦";display:inline-block;font-size:1.15em;color:var(--sr-muted);opacity:.68;letter-spacing:.4em;
}
.sr-columns code{
  font-family:ui-monospace,"SF Mono",Menlo,Consolas,Monaco,monospace;
  font-size:.88em;padding:.15em .45em;border-radius:4px;
  background:color-mix(in srgb,var(--sr-ink) 7%,transparent);
  border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  color:var(--sr-ink);
}
.sr-columns pre{
  break-inside:avoid;white-space:pre-wrap;word-break:break-all;
  font-family:ui-monospace,"SF Mono",Menlo,Consolas,Monaco,monospace;
  font-size:.84em;line-height:1.62;padding:1em 1.2em;
  margin:calc(var(--sr-para-gap,.9em) * 1.1) 0;border-radius:8px;
  background:color-mix(in srgb,var(--sr-ink) 5.5%,transparent);
  border:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);
  color:var(--sr-ink);text-indent:0;
}
.sr-columns pre code{background:transparent;border:0;padding:0;font-size:1em;}
.sr-columns blockquote{
  margin:calc(var(--sr-para-gap,.9em) * 1.15) 0;
  padding:.4em .9em .4em 1.2em;border-left:3px solid var(--sr-accent);
  background:color-mix(in srgb,var(--sr-ink) 3.5%,transparent);border-radius:0 6px 6px 0;
  text-indent:0;font-style:italic;color:color-mix(in srgb,var(--sr-ink) 92%,transparent);
}
.sr-columns ul,.sr-columns ol{
  margin:calc(var(--sr-para-gap,.9em) * .8) 0;padding-left:1.8em;text-indent:0;
}
.sr-columns li{margin-bottom:.35em;line-height:1.8;text-indent:0;}
.sr-columns ruby{font-size:1em;ruby-position:over;ruby-align:center;}
.sr-columns rt{font-size:.52em;color:var(--sr-muted);font-weight:400;letter-spacing:0;text-indent:0;line-height:1;user-select:none;-webkit-user-select:none;}
.sr-table-wrap{max-width:100%;overflow-x:auto;margin:calc(var(--sr-para-gap,.9em) * 1.2) 0;break-inside:avoid;-webkit-overflow-scrolling:touch;}
.sr-columns table{
  width:100%;margin:calc(var(--sr-para-gap,.9em) * 1.2) 0;
  border-collapse:collapse;font-size:.88em;line-height:1.6;
  text-indent:0;break-inside:avoid;
}
.sr-columns th,.sr-columns td{
  padding:8px 12px;border-bottom:1px solid color-mix(in srgb,var(--sr-line) 70%,transparent);text-align:left;
}
.sr-columns th{font-weight:600;color:var(--sr-ink);border-bottom:2px solid color-mix(in srgb,var(--sr-accent) 55%,var(--sr-line));background:color-mix(in srgb,var(--sr-ink) 3.5%,transparent);}
.sr-columns tr:nth-child(even) td{background:color-mix(in srgb,var(--sr-ink) 2%,transparent);}
.sr-math-inline{display:inline-flex;align-items:center;vertical-align:middle;font-family:${SERIF_FONT};font-style:italic;padding:0 2px;}
.sr-math-block{display:flex;align-items:center;justify-content:center;margin:calc(var(--sr-para-gap,.9em) * 1.2) 0;padding:.8em;background:color-mix(in srgb,var(--sr-ink) 2.5%,transparent);border-radius:8px;break-inside:avoid;overflow-x:auto;}
.sr-columns a{
  color:var(--sr-accent);text-decoration:underline;text-underline-offset:3px;
  text-decoration-color:color-mix(in srgb,var(--sr-accent) 40%,transparent);transition:text-decoration-color .15s ease;
}
.sr-columns a:hover{text-decoration-color:var(--sr-accent);}
.sr-columns .sr-figure{margin:calc(var(--sr-para-gap,.9em) * 1.2) 0;text-align:center;text-indent:0;break-inside:avoid;}
.sr-columns .sr-figure img{display:block;max-width:100%;max-height:56vh;height:auto;margin:0 auto;border-radius:6px;object-fit:contain;image-rendering:-webkit-optimize-contrast;}
.sr-columns .sr-figure figcaption{margin-top:.5em;font-size:.86em;line-height:1.6;color:var(--sr-muted,rgba(0,0,0,.55));text-indent:0;}
.sr-columns .sr-figure-missing{text-align:center;text-indent:0;font-size:.9em;color:var(--sr-muted,rgba(0,0,0,.55));}
.sr-columns .sr-figure-zoom{cursor:zoom-in;}
.sr-columns .sr-figure-zoom:focus-visible{outline:2px solid color-mix(in srgb,currentColor 40%,transparent);outline-offset:5px;border-radius:8px;}
.sr-lightbox{
  position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:16px;padding:36px 24px;background:rgba(12,11,10,.86);
  backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);
  cursor:zoom-out;animation:sr-fade .18s cubic-bezier(.16,1,.3,1);
}
.sr-lightbox-img{
  max-width:92vw;max-height:80vh;object-fit:contain;background:#fff;border-radius:10px;
  box-shadow:0 24px 80px -12px rgba(0,0,0,.65),0 4px 16px rgba(0,0,0,.3);
  cursor:default;image-rendering:-webkit-optimize-contrast;transition:transform .2s ease;
}
.sr-lightbox-caption{
  max-width:92vw;margin:0;font-family:${UI_FONT};font-size:12.5px;line-height:1.6;
  letter-spacing:.04em;color:#f6f1e8;text-align:center;padding:4px 14px;
  background:rgba(255,255,255,.09);border-radius:999px;backdrop-filter:blur(10px);
}
.sr-lightbox-close{
  position:absolute;top:18px;right:18px;display:grid;place-items:center;width:38px;height:38px;
  padding:0;border:1px solid rgba(255,255,255,.18);border-radius:50%;
  background:rgba(255,255,255,.12);color:#f6f1e8;cursor:pointer;
  box-shadow:0 4px 14px rgba(0,0,0,.25);backdrop-filter:blur(12px);
  transition:all .15s ease;
}
.sr-lightbox-close:hover{
  background:rgba(255,255,255,.24);transform:scale(1.06);
}
.sr-chapter-end{
  display:flex;align-items:center;justify-content:center;gap:14px;break-before:avoid;
  margin-top:1.6em;text-align:center;text-indent:0;font-family:${SERIF_FONT};font-size:11.5px;
  letter-spacing:.22em;color:var(--sr-muted);opacity:.72;
}
.sr-chapter-end::before,.sr-chapter-end::after{
  content:"";flex:0 0 28px;height:1px;background:color-mix(in srgb,var(--sr-line) 85%,transparent);
}
.sr-chapter-end--book{
  flex-direction:column;gap:5px;margin-top:2.2em;padding:1.4em 0;
  border-top:1px dashed color-mix(in srgb,var(--sr-line) 75%,transparent);
}
.sr-chapter-end--book::before,.sr-chapter-end--book::after{display:none;}
.sr-book-end-badge{
  font-family:${SERIF_FONT};font-size:14px;font-weight:600;letter-spacing:.12em;
  color:var(--sr-accent);
}
.sr-book-end-sub{
  font-family:${UI_FONT};font-size:10.5px;letter-spacing:.04em;
  color:var(--sr-muted);opacity:.85;
}
.sr-hl{
  color:inherit;background:color-mix(in srgb,var(--sr-hl) 20%,transparent);border-radius:2px;
  box-shadow:inset 0 -1px 0 color-mix(in srgb,var(--sr-hl) 64%,transparent);
  cursor:pointer;transition:background .12s ease;
}
.sr-hl:hover{background:color-mix(in srgb,var(--sr-hl) 29%,transparent);}
.sr-hl[data-note="true"]{
  background:color-mix(in srgb,var(--sr-hl) 28%,transparent);
  box-shadow:inset 0 -1.5px 0 color-mix(in srgb,var(--sr-hl) 78%,transparent);
  border-bottom:1.5px dashed color-mix(in srgb,var(--sr-hl) 88%,transparent);
}
.sr-reader[data-theme="night"] .sr-hl, .sr-reader[data-theme="oled"] .sr-hl, .sr-reader[data-theme="forest"] .sr-hl{background:color-mix(in srgb,var(--sr-hl) 17%,transparent);}
.sr-reader[data-theme="night"] .sr-hl[data-note="true"], .sr-reader[data-theme="oled"] .sr-hl[data-note="true"], .sr-reader[data-theme="forest"] .sr-hl[data-note="true"]{
  background:color-mix(in srgb,var(--sr-hl) 25%,transparent);
  border-bottom:1.5px dashed color-mix(in srgb,var(--sr-hl) 88%,transparent);
}
.sr-hl[data-style="underline"]{background:transparent !important;box-shadow:none !important;border-bottom:2px solid var(--sr-hl) !important;padding-bottom:1px;}
.sr-hl[data-style="wavy"]{background:transparent !important;box-shadow:none !important;text-decoration:underline wavy var(--sr-hl) !important;text-underline-offset:3.5px;}
.sr-hl[data-style="strike"]{background:transparent !important;box-shadow:none !important;text-decoration:line-through var(--sr-hl) !important;opacity:.82;}
.sr-reader-bottom{
  position:absolute;z-index:14;left:0;right:0;bottom:16px;
  display:flex;align-items:center;justify-content:center;padding:0 clamp(16px,2.8vw,32px);
  background:transparent;pointer-events:none;
  transition:opacity .22s cubic-bezier(.16,1,.3,1),transform .22s cubic-bezier(.16,1,.3,1);
}
.sr-reader-bottom.is-hidden{opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;}
.sr-reader-bottom-inner{
  pointer-events:auto;display:flex;align-items:center;gap:12px;
  width:100%;max-width:760px;margin:0 auto;padding:6px 14px;
  border-radius:999px;border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel) 90%,transparent);
  box-shadow:0 18px 44px -12px rgba(0,0,0,.26),0 2px 8px -2px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.18);
  backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
}
.sr-reader-tool{
  display:inline-flex;align-items:center;gap:6px;height:29px;padding:0 11px;border:0;border-radius:999px;
  background:transparent;color:var(--sr-muted);font-family:${UI_FONT};font-size:11px;font-weight:550;
  cursor:pointer;white-space:nowrap;transition:all .14s ease;
}
.sr-reader-tool:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 7%,transparent);}
.sr-reader-tool[data-on="true"]{color:var(--sr-accent);background:var(--sr-wash);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sr-accent) 25%,transparent);}
.sr-reader-tool:focus-visible{outline:2px solid var(--sr-accent);outline-offset:1px;}
.sr-reader-range-wrap{flex:1;min-width:90px;display:flex;align-items:center;gap:10px;position:relative;}
.sr-reader-range-tooltip{
  position:absolute;bottom:calc(100% + 8px);transform:translateX(-50%);
  padding:3px 9px;border-radius:7px;background:var(--sr-panel);color:var(--sr-ink);
  border:1px solid var(--sr-line);font-size:10px;font-weight:550;font-family:${UI_FONT};
  box-shadow:0 6px 18px -4px rgba(0,0,0,.22);pointer-events:none;white-space:nowrap;
  animation:sr-fade .12s ease;z-index:20;
}
.sr-reader-range-tooltip::after{
  content:"";position:absolute;bottom:-4px;left:50%;transform:translateX(-50%) rotate(45deg);
  width:6px;height:6px;background:var(--sr-panel);
  border-right:1px solid var(--sr-line);border-bottom:1px solid var(--sr-line);
}
.sr-reader-range{
  appearance:none;-webkit-appearance:none;width:100%;height:18px;background:transparent;cursor:pointer;margin:0;
}
.sr-reader-range::-webkit-slider-runnable-track{
  height:3.5px;border-radius:999px;background:color-mix(in srgb,var(--sr-ink) 13%,transparent);
  transition:background .15s ease;
}
.sr-reader-range:hover::-webkit-slider-runnable-track{
  background:color-mix(in srgb,var(--sr-ink) 20%,transparent);
}
.sr-reader-range::-webkit-slider-thumb{
  -webkit-appearance:none;width:13px;height:13px;margin-top:-4.75px;border-radius:50%;
  background:var(--sr-accent);border:2px solid var(--sr-panel);
  box-shadow:0 1px 4px rgba(0,0,0,.25);transition:transform .12s ease,box-shadow .12s ease;
}
.sr-reader-range:hover::-webkit-slider-thumb{transform:scale(1.2);box-shadow:0 0 0 3px color-mix(in srgb,var(--sr-accent) 26%,transparent),0 2px 7px rgba(0,0,0,.35);}
.sr-reader-range:active::-webkit-slider-thumb{transform:scale(1.35);box-shadow:0 0 0 5px color-mix(in srgb,var(--sr-accent) 32%,transparent),0 2px 9px rgba(0,0,0,.45);}
.sr-reader-range::-moz-range-track{height:3.5px;border-radius:999px;background:color-mix(in srgb,var(--sr-ink) 13%,transparent);}
.sr-reader-range::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:var(--sr-accent);border:2px solid var(--sr-panel);}
.sr-reader-time{font-family:${UI_FONT};font-size:9px;font-weight:500;color:var(--sr-muted);white-space:nowrap;opacity:.8;font-variant-numeric:tabular-nums;cursor:pointer;user-select:none;transition:all .12s ease;}
.sr-reader-time:hover{color:var(--sr-ink);opacity:1;}
.sr-page-jump-anchor{position:relative;display:inline-flex;align-items:center;}
.sr-reader-progress-label{
  background:color-mix(in srgb,var(--sr-ink) 4%,transparent);border:1px solid color-mix(in srgb,var(--sr-line) 70%,transparent);
  padding:2px 8px;margin:0;cursor:pointer;border-radius:6px;font-family:${UI_FONT};
  font-size:10px;font-weight:600;color:var(--sr-muted);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:56px;text-align:center;
  transition:all .15s ease;
}
.sr-reader-progress-label:hover,.sr-reader-progress-label[aria-expanded="true"]{
  background:color-mix(in srgb,var(--sr-ink) 9%,transparent);color:var(--sr-ink);border-color:color-mix(in srgb,var(--sr-accent) 30%,var(--sr-line));
}
.sr-page-jump-popover{
  position:absolute;bottom:calc(100% + 9px);right:0;z-index:30;
  display:flex;align-items:center;gap:6px;padding:7px 10px;
  background:color-mix(in srgb,var(--sr-panel) 95%,transparent);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:10px;
  box-shadow:0 12px 28px -8px rgba(0,0,0,.28);
  font-size:11px;color:var(--sr-ink);white-space:nowrap;animation:sr-fade .14s ease;
}
.sr-page-jump-popover::after{
  content:"";position:absolute;bottom:-5px;right:18px;width:8px;height:8px;
  background:color-mix(in srgb,var(--sr-panel) 95%,transparent);
  border-right:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  transform:rotate(45deg);
}
.sr-page-jump-hint{font-size:10.5px;color:var(--sr-muted);opacity:.85;}
.sr-page-jump-input{
  width:46px;height:24px;padding:0 5px;text-align:center;
  background:var(--sr-bg);color:var(--sr-ink);
  border:1px solid var(--sr-line);border-radius:6px;
  font-size:11.5px;font-variant-numeric:tabular-nums;outline:none;
  transition:border-color .15s ease,box-shadow .15s ease;
}
.sr-page-jump-input:focus{border-color:var(--sr-accent);box-shadow:0 0 0 2.5px var(--sr-wash);}
.sr-page-jump-btn{
  height:24px;padding:0 9px;border:none;border-radius:5px;
  background:var(--sr-accent);color:#fff;font-size:11px;font-weight:600;
  cursor:pointer;transition:opacity .15s ease;
}
.sr-page-jump-btn:hover{opacity:.88;}
.sr-reader-corner{display:none;}
.sr-page-meta{
  position:absolute;z-index:9;left:50%;bottom:14px;transform:translateX(-50%);
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:3px 12px;border-radius:999px;pointer-events:auto;cursor:pointer;
  font-family:${UI_FONT};font-size:9.5px;font-weight:500;letter-spacing:.08em;
  color:var(--sr-muted);font-variant-numeric:tabular-nums;
  background:color-mix(in srgb,var(--sr-panel) 75%,transparent);
  border:1px solid color-mix(in srgb,var(--sr-line) 60%,transparent);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 4px 12px -4px rgba(0,0,0,.1);
  opacity:.82;transition:all .2s ease;
  animation:sr-fade .2s ease;
}
.sr-page-meta:hover{
  opacity:1;
  background:color-mix(in srgb,var(--sr-panel) 92%,transparent);
  border-color:color-mix(in srgb,var(--sr-accent) 35%,var(--sr-line));
  transform:translateX(-50%) translateY(-1px);
}
.sr-page-meta:focus-visible{outline:2px solid var(--sr-accent);outline-offset:2px;}

.sr-reader[data-tts="true"] .sr-reader-bottom{opacity:0 !important;pointer-events:none !important;}
.sr-reader[data-tts="true"] .sr-page-meta{display:none;}
.sr-tts-bar{
  position:absolute;z-index:18;left:50%;bottom:16px;transform:translateX(-50%);
  display:flex;align-items:center;gap:12px;width:min(640px,calc(100% - 32px));padding:8px 12px;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-radius:999px;
  background:color-mix(in srgb,var(--sr-panel) 92%,transparent);
  color:var(--sr-ink);box-shadow:0 18px 44px -12px rgba(0,0,0,.3),0 2px 8px -2px rgba(0,0,0,.08);
  backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
  animation:sr-fade .16s ease;
}
@keyframes sr-tts-pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 color-mix(in srgb,var(--sr-accent) 40%,transparent);}50%{transform:scale(1.06);box-shadow:0 0 0 5px color-mix(in srgb,var(--sr-accent) 0%,transparent);}}
.sr-tts-bar[data-status="playing"] .sr-tts-icon{animation:sr-tts-pulse 2s ease-in-out infinite;}
.sr-tts-icon{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--sr-wash);color:var(--sr-accent);}
.sr-tts-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:1px;}
.sr-tts-copy strong{font-family:${UI_FONT};font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--sr-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-tts-copy span{font-family:${SERIF_FONT};font-size:11.5px;line-height:1.5;color:var(--sr-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-tts-actions{display:flex;align-items:center;gap:4px;flex:none;}
.sr-tts-timer{width:30px;min-width:30px;padding:0;display:inline-flex;align-items:center;justify-content:center;gap:0;font-size:8.5px;border-radius:999px;}
.sr-tts-timer[data-on="true"]{width:auto;min-width:34px;padding:0 8px;color:var(--sr-accent);border-color:color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));background:var(--sr-wash);}
.sr-tts-rate{height:28px;min-width:34px;padding:0 8px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:transparent;color:var(--sr-muted);font-family:${UI_FONT};font-size:9.5px;font-weight:600;cursor:pointer;font-variant-numeric:tabular-nums;transition:all .14s ease;}
.sr-tts-rate:hover{color:var(--sr-ink);background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent) 35%,var(--sr-line));}
.sr-tts-btn{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--sr-muted);cursor:pointer;transition:all .14s ease;}
.sr-tts-btn:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 8%,transparent);}
.sr-tts-btn:focus-visible,.sr-tts-rate:focus-visible{outline:2px solid var(--sr-accent);outline-offset:1px;}
.sr-scrim{
  position:absolute;inset:0;z-index:30;background:rgba(10,14,12,.38);
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:sr-fade .16s ease;
}
.sr-drawer{
  position:absolute;z-index:31;top:0;bottom:0;left:0;width:min(384px,88%);display:flex;flex-direction:column;
  background:color-mix(in srgb,var(--sr-panel) 92%,transparent);color:var(--sr-ink);border-right:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  box-shadow:24px 0 60px -30px rgba(0,0,0,.45);backdrop-filter:blur(28px) saturate(1.2);-webkit-backdrop-filter:blur(28px) saturate(1.2);
  animation:sr-drawer-in .22s cubic-bezier(.16,1,.3,1);
}
.sr-drawer--right{left:auto;right:0;border-right:0;border-left:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);box-shadow:-24px 0 60px -30px rgba(0,0,0,.45);animation-name:sr-drawer-in-right;}
@keyframes sr-drawer-in{from{transform:translateX(-22px);opacity:.4;}to{transform:none;opacity:1;}}
@keyframes sr-drawer-in-right{from{transform:translateX(22px);opacity:.4;}to{transform:none;opacity:1;}}
.sr-drawer-head{flex:none;display:flex;align-items:flex-start;gap:12px;padding:22px 20px 14px;border-bottom:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);}
.sr-drawer-head-main{min-width:0;flex:1;}
.sr-drawer-kicker{font-size:9.5px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--sr-muted);margin-bottom:4px;}
.sr-drawer-head h2{margin:0;font-family:${SERIF_FONT};font-size:18px;line-height:1.35;font-weight:600;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-drawer-head p{margin:4px 0 0;font-size:10px;color:var(--sr-muted);}
.sr-drawer-body{min-height:0;flex:1;overflow-y:auto;padding:12px 11px 33px;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--sr-ink) 18%,transparent) transparent;}
.sr-drawer-tabs{
  display:flex;gap:3px;padding:3px;margin:12px 14px 4px;border-radius:9px;
  border:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);
  background:color-mix(in srgb,var(--sr-ink) 4%,transparent);
}
.sr-drawer-tab{
  flex:1;height:27px;border:0;border-radius:7px;background:transparent;color:var(--sr-muted);
  font-size:11px;font-weight:550;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  transition:all .15s ease;
}
.sr-drawer-tab[aria-pressed="true"]{
  color:var(--sr-ink);background:var(--sr-panel);font-weight:600;
  box-shadow:0 1px 3px rgba(0,0,0,.08);
}
.sr-toc-search{display:flex;align-items:center;gap:7px;margin:0 0 12px;padding:7px 11px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sr-ink) 4%,transparent);color:var(--sr-muted);position:relative;}
.sr-toc-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--sr-ink);font-family:${UI_FONT};font-size:11.5px;outline:none;}
.sr-toc-search input::placeholder{color:var(--sr-muted);}
.sr-toc-search input[type="search"]::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none;}
.sr-toc-search-clear{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--sr-ink) 10%,transparent);color:var(--sr-muted);cursor:pointer;}
.sr-toc-search-clear:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 16%,transparent);}
.sr-toc-search-empty{position:absolute;left:10px;right:10px;bottom:calc(100% + 2px);font-family:${UI_FONT};font-size:10px;color:var(--sr-muted);}
.sr-toc-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 18px 10px;border-bottom:1px solid color-mix(in srgb,var(--sr-line) 48%,transparent);}
.sr-toc-summary{font-size:8.5px;letter-spacing:.04em;color:var(--sr-muted);}
.sr-toc-filter{display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 8px;border:1px solid var(--sr-line);border-radius:999px;background:transparent;color:var(--sr-muted);font:inherit;font-size:9px;cursor:pointer;}
.sr-toc-filter[aria-pressed="true"]{color:var(--sr-accent);border-color:color-mix(in srgb,var(--sr-accent) 38%,var(--sr-line));background:var(--sr-wash);}
.sr-notes-filter-box{padding:6px 14px 4px;display:flex;flex-direction:column;gap:6px;}
.sr-notes-search-field{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sr-ink) 4%,transparent);color:var(--sr-muted);}
.sr-notes-search-field input{flex:1;min-width:0;height:24px;border:0;background:transparent;color:var(--sr-ink);font-family:${UI_FONT};font-size:11px;outline:none;}
.sr-notes-search-field input::placeholder{color:var(--sr-muted);opacity:.8;}
.sr-notes-filter-chips{display:flex;align-items:center;gap:4px;overflow-x:auto;padding-bottom:2px;}
.sr-notes-chip{display:inline-flex;align-items:center;justify-content:center;height:21px;padding:0 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);background:transparent;color:var(--sr-muted);font-family:${UI_FONT};font-size:9.5px;cursor:pointer;transition:all .12s ease;white-space:nowrap;}
.sr-notes-chip:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 6%,transparent);}
.sr-notes-chip[data-active="true"]{color:var(--sr-accent);background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent) 45%,var(--sr-line));font-weight:600;}
.sr-notes-chip--color{width:21px;height:21px;padding:0;border-radius:50%;}
.sr-notes-color-pip{width:8px;height:8px;border-radius:50%;background:var(--sr-chip-color);box-shadow:0 0 0 1px rgba(0,0,0,.15);}
.sr-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
.sr-toc-badges{display:flex;align-items:center;gap:4px;flex:none;}
.sr-toc-badge{display:inline-flex;align-items:center;gap:2px;font-size:8px;color:var(--sr-muted);font-variant-numeric:tabular-nums;padding:1px 5px;border-radius:99px;background:color-mix(in srgb,var(--sr-ink) 5%,transparent);}
.sr-toc-row[data-read="true"] .sr-toc-num{font-size:9px;color:var(--sr-muted);}
.sr-toc-row{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:10px 11px;border:0;border-radius:9px;
  background:transparent;color:inherit;text-align:left;cursor:pointer;transition:background .13s ease;
}
.sr-toc-row:hover{background:color-mix(in srgb,var(--sr-ink) 5%,transparent);}
.sr-toc-row[data-current="true"]{background:var(--sr-wash);box-shadow:inset 2.5px 0 0 var(--sr-accent);}
.sr-toc-num{flex:0 0 23px;font-family:${UI_FONT};font-size:9.5px;color:var(--sr-muted);font-variant-numeric:tabular-nums;line-height:1.9;}
.sr-toc-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}
.sr-toc-copy strong{font-family:${SERIF_FONT};font-size:12.5px;line-height:1.55;font-weight:500;letter-spacing:.02em;}
.sr-toc-row[data-current="true"] .sr-toc-copy strong{color:var(--sr-accent);font-weight:600;}
.sr-toc-copy small{font-size:9px;color:var(--sr-muted);}
.sr-toc-progress{display:block;height:2px;margin-top:3px;border-radius:99px;background:color-mix(in srgb,var(--sr-ink) 9%,transparent);overflow:hidden;}
.sr-toc-progress-fill{display:block;height:100%;border-radius:99px;background:color-mix(in srgb,var(--sr-accent) 62%,transparent);}
.sr-toc-row[data-current="true"] .sr-toc-progress-fill{background:var(--sr-accent);}
.sr-toc-mark{width:5px;height:5px;border-radius:50%;background:var(--sr-accent);box-shadow:0 0 6px var(--sr-accent);margin-top:8px;flex:none;}
.sr-drawer-note{
  margin:0 3px 9px;padding:13px 13px 10px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:12px;
  background:color-mix(in srgb,var(--sr-panel) 75%,var(--sr-bg));position:relative;box-shadow:0 2px 6px -2px rgba(0,0,0,.06);
  transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease;
}
.sr-drawer-note:hover{
  border-color:color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));
  box-shadow:0 4px 14px -3px rgba(0,0,0,.12);
  transform:translateY(-1px);
}
.sr-drawer-note-quote{
  margin:0;padding-left:10px;font-family:${SERIF_FONT};font-size:12.5px;line-height:1.8;
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;
  border-left:2px solid var(--sr-hl,var(--sr-accent));
}
.sr-drawer-note-thought{margin:8px 0 0;padding:8px 9px;border-radius:6px;background:var(--sr-wash);font-size:10.5px;line-height:1.65;white-space:pre-wrap;color:var(--sr-ink);}
.sr-drawer-note-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;}
.sr-drawer-note-meta{font-size:8.5px;color:var(--sr-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-drawer-note-actions{display:flex;gap:1px;flex:none;}
.sr-mini-action{border:0;background:transparent;color:var(--sr-muted);font-size:9.5px;cursor:pointer;padding:3px 5px;border-radius:4px;white-space:nowrap;}
.sr-mini-action:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 7%,transparent);}
.sr-mini-action[data-danger="true"]:hover{color:#c46a62;background:rgba(196,106,98,.09);}
.sr-bookmark-row{display:flex;align-items:center;gap:9px;width:100%;padding:10px 9px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;}
.sr-bookmark-row:hover{background:color-mix(in srgb,var(--sr-ink) 5%,transparent);}
.sr-bookmark-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;}
.sr-bookmark-main strong{font-family:${SERIF_FONT};font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-bookmark-excerpt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-family:${SERIF_FONT};font-size:10px;line-height:1.6;color:var(--sr-muted);font-style:normal;white-space:normal;}
.sr-bookmark-card-info .sr-bookmark-excerpt{color:var(--dsw-alias-label-secondary);font-size:10px;line-height:1.55;opacity:.9;}
.sr-bookmark-main small{font-size:9px;color:var(--sr-muted);}
.sr-bookmark-note{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:9.5px;line-height:1.55;color:var(--sr-accent);white-space:pre-wrap;opacity:.9;}
.sr-bookmark-card-info .sr-bookmark-note{grid-column:1/-1;font-style:normal;color:var(--dsw-alias-brand-primary);}
.sr-detail-bookmark-note{font-size:9px;line-height:1.5;color:var(--dsw-alias-brand-primary);white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sr-bookmark-row .sr-mini-action{opacity:0;}
.sr-bookmark-row:hover .sr-mini-action{opacity:1;}
@media (hover: none){.sr-bookmark-row .sr-mini-action{opacity:.8;}}
.sr-drawer-empty{padding:45px 20px;text-align:center;color:var(--sr-muted);font-size:11px;line-height:1.7;}
.sr-drawer-empty svg{opacity:.45;margin-bottom:7px;}
.sr-drawer-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 18px 15px;border-top:1px solid var(--sr-line);font-size:9px;color:var(--sr-muted);letter-spacing:.02em;}
.sr-export-notes-btn{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:600;color:var(--sr-accent);border:1px solid color-mix(in srgb,var(--sr-accent) 30%,var(--sr-line));border-radius:6px;padding:3px 8px;background:var(--sr-wash);cursor:pointer;transition:all .14s ease;}
.sr-export-notes-btn:hover{background:color-mix(in srgb,var(--sr-accent) 20%,transparent);color:var(--sr-accent);}
.sr-drawer--search{width:min(438px,94%);}
.sr-search-body{padding:12px 14px 30px;display:flex;flex-direction:column;}
.sr-search-field{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:7px;flex:none;padding:8px 12px;margin:0 0 12px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sr-panel) 95%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 4px 14px -6px rgba(0,0,0,.15);}
.sr-search-field>svg{color:var(--sr-muted);flex:none;}
.sr-search-field input{appearance:none;-webkit-appearance:none;width:100%;min-width:0;height:25px;padding:0;border:0;background:transparent;color:var(--sr-ink);font-size:12px;outline:none;}
.sr-search-field input::placeholder{color:var(--sr-muted);opacity:.8;}
.sr-search-field:focus-within{border-color:color-mix(in srgb,var(--sr-accent) 48%,var(--sr-line));box-shadow:0 0 0 3px var(--sr-wash);}
.sr-search-clear{width:21px;height:21px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--sr-ink) 7%,transparent);color:var(--sr-muted);cursor:pointer;}
.sr-search-clear:hover{color:var(--sr-ink);background:color-mix(in srgb,var(--sr-ink) 12%,transparent);}
.sr-search-scopes{display:flex;align-items:center;gap:6px;margin:0 0 10px;padding:1px 0;}
.sr-search-scope{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:14px;border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);background:color-mix(in srgb,var(--sr-panel) 92%,transparent);color:var(--sr-muted);font-size:11px;cursor:pointer;transition:all .14s ease;}
.sr-search-scope:hover{color:var(--sr-ink);border-color:color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));}
.sr-search-scope.is-active{color:var(--sr-accent);border-color:color-mix(in srgb,var(--sr-accent) 55%,transparent);background:var(--sr-wash);font-weight:600;}
.sr-search-scope-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:8px;font-size:9.5px;font-variant-numeric:tabular-nums;line-height:1;background:color-mix(in srgb,var(--sr-line) 60%,transparent);color:var(--sr-muted);}
.sr-search-scope.is-active .sr-search-scope-count{background:color-mix(in srgb,var(--sr-accent) 22%,transparent);color:var(--sr-accent);}
.sr-search-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:54px 18px 38px;text-align:center;color:var(--sr-muted);font-size:10.5px;line-height:1.72;}
.sr-search-empty>svg{opacity:.44;margin-bottom:2px;}
.sr-search-empty strong{font-family:${SERIF_FONT};font-size:14px;font-weight:500;color:var(--sr-ink);}
.sr-search-empty p{margin:0;max-width:270px;}
.sr-search-suggest-box{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:14px;width:100%;}
.sr-search-suggest-title{font-size:9.5px;font-weight:600;letter-spacing:.04em;color:var(--sr-muted);text-transform:uppercase;}
.sr-search-suggest-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:320px;}
.sr-search-suggest-chip{display:inline-flex;align-items:center;padding:3px 9px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sr-panel) 90%,transparent);color:var(--sr-muted);font-family:${UI_FONT};font-size:10px;cursor:pointer;transition:all .12s ease;}
.sr-search-suggest-chip:hover{color:var(--sr-ink);border-color:color-mix(in srgb,var(--sr-accent) 40%,var(--sr-line));background:var(--sr-wash);}
.sr-detail-offline-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--sr-accent,var(--dsw-alias-brand-primary)) 12%,transparent);color:var(--sr-accent,var(--dsw-alias-brand-primary));font-size:9px;font-weight:600;letter-spacing:.02em;}
.sr-search-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 3px 8px;font-size:8.5px;letter-spacing:.02em;color:var(--sr-muted);}
.sr-search-results{display:flex;flex-direction:column;gap:3px;}
.sr-search-result{display:block;width:100%;padding:10px 11px;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;text-align:left;cursor:pointer;transition:background .13s ease,border-color .13s ease;}
.sr-search-result:hover,.sr-search-result:focus-visible{background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent) 20%,transparent);}
.sr-search-result[data-active="true"]{background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent) 45%,transparent);box-shadow:inset 2.5px 0 0 var(--sr-accent);}
.sr-search-result:focus-visible{outline:2px solid var(--sr-accent);outline-offset:1px;}
.sr-search-result-head{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:4px;}
.sr-search-result-chapter{min-width:0;font-family:${SERIF_FONT};font-size:10.5px;line-height:1.4;font-weight:600;color:var(--sr-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-search-result-actions{display:flex;align-items:center;gap:6px;flex:none;}
.sr-search-copy-btn{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:none;border-radius:4px;background:transparent;color:var(--sr-muted);cursor:pointer;opacity:.65;transition:opacity .12s,background .12s,color .12s;}
.sr-search-copy-btn:hover{opacity:1;color:var(--sr-accent);background:color-mix(in srgb,var(--sr-accent) 15%,transparent);}
.sr-search-result-index{font-size:8px;color:var(--sr-muted);font-variant-numeric:tabular-nums;flex:none;}
.sr-search-result-text{margin:0;font-family:${SERIF_FONT};font-size:11.5px;line-height:1.75;color:var(--sr-ink);word-break:break-word;}
.sr-search-result-text mark{padding:0 1px;border-radius:2px;color:inherit;background:color-mix(in srgb,var(--sr-accent) 24%,transparent);box-shadow:inset 0 -1px 0 color-mix(in srgb,var(--sr-accent) 58%,transparent);}

.sr-sheet-scrim{
  position:absolute;inset:0;z-index:40;background:rgba(10,14,12,.36);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
  animation:sr-fade .16s ease;
}
.sr-sheet{
  position:absolute;z-index:41;left:50%;bottom:20px;transform:translateX(-50%);
  width:min(560px,calc(100% - 32px));max-height:calc(100% - 36px);overflow-y:auto;
  box-sizing:border-box;
  padding:22px 24px 20px;border-radius:22px;border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel) 94%,transparent);color:var(--sr-ink);
  box-shadow:0 32px 80px -20px rgba(0,0,0,.45),0 4px 16px -4px rgba(0,0,0,.1);
  backdrop-filter:blur(28px) saturate(1.2);-webkit-backdrop-filter:blur(28px) saturate(1.2);
  animation:sr-sheet-up .22s cubic-bezier(.16,1,.3,1) both;
}
.sr-sheet::before{
  content:"";display:block;width:36px;height:4px;border-radius:2px;
  background:color-mix(in srgb,var(--sr-ink) 18%,transparent);
  margin:-10px auto 16px;
}
.sr-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;}
.sr-sheet-head-actions{display:flex;align-items:center;gap:2px;flex:none;}
.sr-sheet-head strong{font-family:${SERIF_FONT};font-size:16px;font-weight:600;letter-spacing:.04em;}
.sr-setting-group{margin-top:14px;}
.sr-setting-group:first-of-type{margin-top:0;}
.sr-setting-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--sr-muted);}
.sr-setting-label span{font-family:${UI_FONT};font-weight:400;text-transform:none;letter-spacing:.02em;font-size:9.5px;opacity:.76;}
.sr-theme-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:7px;}
.sr-theme-swatch{
  height:54px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:12px;padding:0;cursor:pointer;position:relative;
  display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:3px;
  color:var(--sw-ink);background:var(--sw-bg);overflow:hidden;text-align:left;
  box-shadow:0 1px 3px rgba(0,0,0,.06);transition:all .15s ease;
}
.sr-theme-swatch:hover{transform:translateY(-1px);box-shadow:0 4px 10px -2px rgba(0,0,0,.12);}
.sr-theme-swatch::before{content:"文";position:absolute;right:8px;top:5px;font-family:${SERIF_FONT};font-size:18px;color:var(--sw-ink);opacity:.48;}
.sr-theme-swatch span{font-size:9.5px;font-weight:550;padding:0 8px 6px;opacity:.88;line-height:1.2;}
.sr-book-last{font-size:10px;color:var(--sr-muted,#8a7860);margin-top:2px;line-height:1.2;}
.sr-book-row-side .sr-book-last{font-size:10px;color:var(--sr-muted,#8a7860);}
.sr-theme-swatch--auto{grid-column:1 / -1;height:44px;}
.sr-theme-swatch--auto::before{right:14px;left:auto;top:10px;}
.sr-theme-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px var(--sr-panel),0 0 0 4px var(--sr-accent);}
.sr-theme-check{
  position:absolute;top:6px;left:7px;
  width:16px;height:16px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--sr-accent);color:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.25);
  animation:sr-pop .14s cubic-bezier(.16,1,.3,1);
}
.sr-font-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.sr-font-sample{flex:1;font-family:${SERIF_FONT};font-size:15px;line-height:1.5;color:var(--sr-ink);}
.sr-font-sample small{display:block;margin-top:2px;font-family:${UI_FONT};font-size:9px;letter-spacing:.04em;color:var(--sr-muted);}
.sr-stepper{display:flex;align-items:center;gap:1px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--sr-ink) 3%,transparent);}
.sr-step-btn{width:30px;height:28px;border:0;background:transparent;color:var(--sr-muted);cursor:pointer;font-size:16px;line-height:1;transition:background .13s ease,color .13s ease;}
.sr-step-btn:hover{background:color-mix(in srgb,var(--sr-ink) 8%,transparent);color:var(--sr-ink);}
.sr-step-value{min-width:38px;text-align:center;font-size:11px;font-weight:600;color:var(--sr-ink);font-variant-numeric:tabular-nums;border-left:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);border-right:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);line-height:28px;}
.sr-segment{display:flex;gap:2px;padding:3px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:9px;background:color-mix(in srgb,var(--sr-ink) 4%,transparent);}
.sr-segment button{height:25px;padding:0 10px;border:0;border-radius:6px;background:transparent;color:var(--sr-muted);font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .14s ease;}
.sr-segment button[aria-pressed="true"]{background:var(--sr-panel);color:var(--sr-ink);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.1);}
.sr-setting-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:1px 0;}
.sr-setting-select{width:100%;height:32px;padding:0 10px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:9px;background:color-mix(in srgb,var(--sr-panel) 70%,var(--sr-bg));color:var(--sr-ink);font-size:11px;outline:none;cursor:pointer;transition:all .15s ease;}
.sr-setting-select:focus{border-color:var(--sr-accent);box-shadow:0 0 0 3px var(--sr-wash);}
.sr-setting-color-row{display:flex;align-items:center;gap:8px;padding:2px 0;}
.sr-setting-color{width:19px;height:19px;padding:0;border:1px solid rgba(0,0,0,.13);border-radius:50%;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;}
.sr-setting-color:hover{transform:scale(1.1);}
.sr-setting-color[aria-pressed="true"]{box-shadow:0 0 0 2px var(--sr-panel),0 0 0 3.5px var(--sr-accent);}
.sr-color-filter{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:-5px 0 14px;padding-left:2px;color:var(--dsw-alias-label-secondary);font-size:9.5px;}
.sr-color-filter-label{margin-right:2px;opacity:.8;}
.sr-color-filter-pill{
  appearance:none;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px 0 6px;
  border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 75%,transparent);
  border-radius:12px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 80%,transparent);
  color:var(--dsw-alias-label-secondary);font-size:9.5px;cursor:pointer;
  transition:all .14s ease;
}
.sr-color-filter-pill:hover{
  background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);
  border-color:color-mix(in oklab,var(--dsw-alias-border-l2) 90%,transparent);
}
.sr-color-filter-pill[aria-pressed="true"]{
  background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);
  border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary);
}
.sr-color-filter-pill .sr-color-filter-dot{
  width:9px;height:9px;padding:0;border:1px solid rgba(0,0,0,.15);border-radius:50%;opacity:1;box-shadow:none;
}
.sr-color-filter-name{font-size:9.5px;}
.sr-color-filter-count{font-variant-numeric:tabular-nums;opacity:.75;font-size:9px;}
.sr-color-filter-clear{font-size:9.5px;padding:0 4px;margin-left:2px;}
.sr-color-filter-dot{width:15px;height:15px;padding:0;border:1px solid rgba(0,0,0,.13);border-radius:50%;cursor:pointer;opacity:.48;transition:transform .12s ease,opacity .12s ease,box-shadow .12s ease;}
.sr-color-filter-dot:hover{opacity:.85;transform:scale(1.1);}
.sr-color-filter-dot[aria-pressed="true"]{opacity:1;box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 0 3px var(--dsw-alias-brand-primary);}
.sr-color-filter-dot:focus-visible,.sr-setting-color:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.sr-setting-hint{margin:0;font-size:9px;line-height:1.6;color:var(--sr-muted);max-width:340px;}
.sr-switch{position:relative;width:38px;height:22px;flex:none;padding:0;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sr-ink) 12%,transparent);cursor:pointer;transition:background .18s ease,border-color .18s ease;}
.sr-switch .sr-switch-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:transform .18s cubic-bezier(.16,1,.3,1);display:block;}
.sr-switch[aria-checked="true"]{background:var(--sr-accent);border-color:var(--sr-accent);}
.sr-switch[aria-checked="true"] .sr-switch-thumb{transform:translateX(16px);}
.sr-switch:focus-visible{outline:2px solid var(--sr-accent);outline-offset:2px;}
.sr-sheet-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:11px;border-top:1px solid var(--sr-line);}
.sr-sheet-foot .sr-text-btn{font-size:10px;color:var(--sr-muted);display:inline-flex;align-items:center;gap:4px;}
.sr-sheet-foot .sr-text-btn:hover{color:var(--sr-ink);}
.sr-sheet-note{margin:0;font-size:9px;color:var(--sr-muted);line-height:1.5;}
.sr-fullscreen-exit-btn{
  position:fixed;top:16px;right:18px;z-index:100;
  appearance:none;display:flex;align-items:center;gap:6px;
  padding:5px 11px;border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(20,25,28,.72);color:rgba(255,255,255,.85);
  font-size:10px;letter-spacing:.02em;cursor:pointer;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  box-shadow:0 4px 16px rgba(0,0,0,.35);
  transition:background .15s ease,opacity .2s ease,transform .15s ease;
  animation:sr-fade .2s ease;
}
.sr-fullscreen-exit-btn:hover{background:rgba(20,25,28,.92);color:#fff;transform:scale(1.04);}
.sr-selection-toolbar{
  position:fixed;z-index:150;display:flex;align-items:center;gap:3px;padding:4px 7px;
  border-radius:999px;border:1px solid color-mix(in srgb,var(--sr-line,var(--dsw-alias-border-l1)) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel,var(--dsw-alias-bg-overlay)) 94%,transparent);
  color:var(--sr-ink,var(--dsw-alias-label-primary));box-shadow:0 18px 46px -12px rgba(0,0,0,.35),0 2px 8px rgba(0,0,0,.08);
  animation:sr-fade .12s ease;backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
}
.sr-sel-colors{display:flex;align-items:center;gap:4px;padding:0 3px;}
.sr-sel-color{
  width:16px;height:16px;padding:0;border:1.5px solid rgba(255,255,255,.3);border-radius:50%;
  cursor:pointer;opacity:.78;transition:transform .12s cubic-bezier(.16,1,.3,1),opacity .12s ease,box-shadow .12s ease;
}
.sr-sel-color:hover{opacity:1;transform:scale(1.15);}
.sr-sel-color[aria-pressed="true"]{opacity:1;box-shadow:0 0 0 2px var(--sr-panel),0 0 0 3.5px var(--sr-accent);transform:scale(1.1);}
.sr-sel-btn{
  display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 10px;border:0;border-radius:999px;
  background:transparent;color:var(--sr-ink,var(--dsw-alias-label-primary));font-size:11px;font-weight:550;cursor:pointer;white-space:nowrap;
  transition:all .13s ease;
}
.sr-sel-btn:hover{background:color-mix(in srgb,var(--sr-ink,var(--dsw-alias-label-primary)) 8%,transparent);}
.sr-sel-divider{width:1px;height:17px;background:color-mix(in srgb,var(--sr-line,var(--dsw-alias-border-l1)) 85%,transparent);margin:0 2px;}
.sr-help-backdrop{
  position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(10,14,12,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  animation:sr-fade .15s ease;
}
.sr-help-card{
  width:min(450px,100%);max-height:calc(100% - 20px);overflow-y:auto;padding:22px;
  border-radius:20px;border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel) 94%,transparent);color:var(--sr-ink);
  box-shadow:0 28px 72px -20px rgba(0,0,0,.5);backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
  animation:sr-pop .18s cubic-bezier(.16,1,.3,1);
}
.sr-help-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.sr-help-head h2{margin:2px 0 0;font-family:${SERIF_FONT};font-size:18px;font-weight:600;letter-spacing:.04em;}
.sr-help-search{
  display:flex;align-items:center;gap:6px;padding:6px 12px;margin-bottom:12px;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);
  background:color-mix(in srgb,var(--sr-ink) 4%,transparent);color:var(--sr-muted);
}
.sr-help-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--sr-ink);font-size:11.5px;outline:none;}
.sr-help-search input::placeholder{color:var(--sr-muted);opacity:.75;}
.sr-help-search-clear{border:0;background:transparent;color:var(--sr-muted);cursor:pointer;padding:2px;display:inline-flex;}
.sr-help-search-clear:hover{color:var(--sr-ink);}
.sr-help-tabs{
  display:flex;align-items:center;gap:3px;margin-bottom:12px;padding:3px;border-radius:9px;
  border:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);background:color-mix(in srgb,var(--sr-ink) 4%,transparent);
  overflow-x:auto;
}
.sr-help-tab{
  padding:3px 10px;border-radius:6px;border:0;background:transparent;color:var(--sr-muted);
  font-size:10.5px;font-weight:550;cursor:pointer;white-space:nowrap;transition:all .14s ease;
}
.sr-help-tab:hover{color:var(--sr-ink);}
.sr-help-tab[data-active="true"]{color:var(--sr-ink);background:var(--sr-panel);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08);}
.sr-help-empty{padding:24px 0;text-align:center;font-size:11px;color:var(--sr-muted);}
.sr-shortcut-list{border-top:1px solid color-mix(in srgb,var(--sr-line) 75%,transparent);}
.sr-shortcut-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:36px;padding:7px 2px;border-bottom:1px solid color-mix(in srgb,var(--sr-line) 55%,transparent);font-size:11.5px;color:var(--sr-ink);}
.sr-keys{display:flex;align-items:center;justify-content:flex-end;gap:4px;flex-wrap:wrap;}
.sr-keys kbd{
  display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:21px;padding:0 6px;
  border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);border-bottom-width:2px;border-radius:5px;
  background:color-mix(in srgb,var(--sr-panel) 60%,var(--sr-bg));color:var(--sr-ink);font-family:${UI_FONT};
  font-size:9.5px;font-weight:600;line-height:1;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.06);
}
.sr-help-hint{margin:12px 0 0;font-size:8.5px;line-height:1.6;color:var(--sr-muted);text-align:center;}
.sr-thought-backdrop{
  position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(10,14,12,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  animation:sr-fade .14s ease;
}
.sr-thought-card{
  width:min(460px,100%);max-height:calc(100% - 16px);overflow-y:auto;padding:22px;
  border-radius:20px;border:1px solid color-mix(in srgb,var(--sr-line) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel) 94%,transparent);color:var(--sr-ink);
  box-shadow:0 28px 72px -20px rgba(0,0,0,.5);backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
  animation:sr-pop .18s cubic-bezier(.16,1,.3,1);
}
.sr-thought-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.sr-thought-head h2{margin:0;font-family:${SERIF_FONT};font-size:18px;font-weight:600;letter-spacing:.04em;}
.sr-thought-head p{margin:4px 0 0;font-size:10px;color:var(--sr-muted);line-height:1.5;}
.sr-thought-quote{
  margin:0 0 14px;padding:10px 13px;border-left:2.5px solid var(--sr-hl,var(--sr-accent));
  background:var(--sr-wash);border-radius:0 9px 9px 0;
  font-family:${SERIF_FONT};font-size:12.5px;line-height:1.8;max-height:130px;overflow-y:auto;white-space:pre-wrap;
}
.sr-thought-textarea{
  width:100%;min-height:110px;resize:vertical;padding:11px 12px;border-radius:10px;
  border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  background:color-mix(in srgb,var(--sr-bg) 60%,var(--sr-panel));
  color:var(--sr-ink);font-size:12.5px;line-height:1.7;outline:none;
  transition:border-color .15s ease,box-shadow .15s ease;
}
.sr-thought-textarea::placeholder{color:var(--sr-muted);opacity:.8;}
.sr-thought-textarea:focus{border-color:var(--sr-accent);box-shadow:0 0 0 3px var(--sr-wash);}
.sr-thought-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;}
.sr-color-row{display:flex;align-items:center;gap:7px;}
.sr-color-dot{width:16px;height:16px;padding:0;border:1px solid rgba(0,0,0,.13);border-radius:50%;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;}
.sr-color-dot:hover{transform:scale(1.15);}
.sr-color-dot[aria-pressed="true"]{box-shadow:0 0 0 2px var(--sr-panel),0 0 0 3.5px var(--sr-accent);}
.sr-thought-actions{display:flex;align-items:center;gap:6px;}
.sr-reader-btn{
  height:30px;padding:0 13px;border-radius:999px;border:1px solid color-mix(in srgb,var(--sr-line) 80%,transparent);
  background:transparent;color:var(--sr-ink);font-size:11px;font-weight:550;cursor:pointer;white-space:nowrap;
  transition:all .14s ease;
}
.sr-reader-btn:hover{background:color-mix(in srgb,var(--sr-ink) 7%,transparent);}
.sr-reader-btn--primary{background:var(--sr-accent);border-color:var(--sr-accent);color:#fff;font-weight:600;}
.sr-reader-btn--primary:hover{filter:brightness(1.06);background:var(--sr-accent);}
.sr-reader-btn--primary:disabled{opacity:.42;cursor:default;filter:none;background:var(--sr-accent);}
.sr-reader-btn:focus-visible,.sr-color-dot:focus-visible,.sr-theme-swatch:focus-visible,.sr-seg-btn:focus-visible,.sr-segment button:focus-visible,.sr-step-btn:focus-visible,.sr-drawer-tab:focus-visible,.sr-mini-action:focus-visible,.sr-toc-row:focus-visible,.sr-bookmark-main:focus-visible{outline:2px solid var(--sr-accent);outline-offset:2px;}
.sr-hl-peek{
  position:fixed;z-index:151;width:min(320px,calc(100vw - 26px));padding:13px 14px 12px;
  border-radius:14px;border:1px solid color-mix(in srgb,var(--sr-line,var(--dsw-alias-border-l1)) 85%,transparent);
  background:color-mix(in srgb,var(--sr-panel,var(--dsw-alias-bg-overlay)) 94%,transparent);
  color:var(--sr-ink,var(--dsw-alias-label-primary));box-shadow:0 20px 48px -16px rgba(0,0,0,.35);
  animation:sr-fade .12s ease;backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
}
.sr-hl-peek-quote{margin:0;font-family:${SERIF_FONT};font-size:12px;line-height:1.75;max-height:92px;overflow:hidden;white-space:pre-wrap;border-left:2.5px solid var(--sr-hl,var(--sr-accent,var(--dsw-alias-brand-primary)));padding-left:9px;}
.sr-hl-peek-note{margin:8px 0 0;padding:8px 10px;border-radius:8px;background:color-mix(in srgb,var(--sr-ink,var(--dsw-alias-label-primary)) 6%,transparent);font-size:11px;line-height:1.65;white-space:pre-wrap;}
.sr-hl-peek-styles{display:flex;align-items:center;gap:3px;margin:8px 0 2px;}
.sr-hl-peek-style-btn{flex:1;height:22px;padding:0 4px;border:1px solid color-mix(in srgb,var(--sr-line,var(--dsw-alias-border-l1)) 75%,transparent);border-radius:5px;background:transparent;color:var(--sr-muted,var(--dsw-alias-label-secondary));font-family:${UI_FONT};font-size:9.5px;font-weight:550;cursor:pointer;transition:all .12s ease;text-align:center;}
.sr-hl-peek-style-btn:hover{color:var(--sr-ink,var(--dsw-alias-label-primary));background:color-mix(in srgb,var(--sr-ink,var(--dsw-alias-label-primary)) 6%,transparent);}
.sr-hl-peek-style-btn[data-active="true"]{color:var(--sr-accent,var(--dsw-alias-brand-primary));background:var(--sr-wash);border-color:color-mix(in srgb,var(--sr-accent,var(--dsw-alias-brand-primary)) 45%,var(--sr-line,var(--dsw-alias-border-l1)));font-weight:600;}
.sr-hl-peek-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--sr-line,var(--dsw-alias-border-l1)) 65%,transparent);}
.sr-hl-peek-colors{display:flex;align-items:center;gap:5px;flex:none;}
.sr-hl-peek-colors .sr-color-dot{width:13px;height:13px;border-radius:50%;border:0;cursor:pointer;padding:0;transition:transform .12s ease;}
.sr-hl-peek-colors .sr-color-dot:hover{transform:scale(1.25);}
.sr-hl-peek-colors .sr-color-dot[data-active="true"]{box-shadow:0 0 0 1.5px var(--sr-panel,var(--dsw-alias-bg-overlay)), 0 0 0 3px var(--sr-accent,var(--dsw-alias-brand-primary));transform:scale(1.15);}
.sr-hl-peek-foot small{font-size:9px;color:var(--sr-muted,var(--dsw-alias-label-secondary));white-space:nowrap;}
.sr-hl-peek-actions{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;}
.sr-hl-peek-btn{border:0;background:transparent;color:var(--sr-muted,var(--dsw-alias-label-secondary));font-size:10px;font-weight:500;padding:3px 7px;border-radius:6px;cursor:pointer;transition:all .12s ease;}
.sr-hl-peek-btn:hover{background:color-mix(in srgb,var(--sr-ink,var(--dsw-alias-label-primary)) 8%,transparent);color:var(--sr-ink,var(--dsw-alias-label-primary));}
.sr-hl-peek-btn[data-danger="true"]:hover{color:var(--dsw-alias-state-error-primary);background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 12%,transparent);}
.sr-hidden-input{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
.sr-goal-daily{margin-top:12px;}
.sr-goal-daily-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:10px;color:var(--dsw-alias-label-secondary);}
.sr-goal-daily-head strong{font-size:10.5px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;}
.sr-goal-daily-title-wrap{display:flex;align-items:center;}
.sr-goal-badge-done{display:inline-flex;align-items:center;padding:1px 6px;margin-left:6px;border-radius:10px;font-size:9.5px;font-weight:600;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary);}
.sr-goal-daily-track{display:block;height:4px;margin-top:6px;border-radius:99px;background:color-mix(in oklab,var(--dsw-alias-border-l1) 80%,transparent);overflow:hidden;}
.sr-goal-daily-fill{display:block;height:100%;border-radius:99px;background:var(--sr-accent-strong);transition:width .4s ease;}
.sr-goal-daily-fill[data-done="true"]{background:color-mix(in oklab,var(--dsw-alias-brand-primary) 55%,#4f9a6a);}
.sr-goal-daily-note{display:block;margin-top:5px;font-size:9px;line-height:1.5;color:var(--dsw-alias-label-secondary);opacity:.78;}
.sr-note-tags{display:flex;flex-wrap:wrap;gap:5px;}
.sr-note-tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:99px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 10%,transparent);color:var(--dsw-alias-brand-primary);font-size:9px;letter-spacing:.02em;}
.sr-tag-filter{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:9.5px;color:var(--dsw-alias-label-secondary);}
.sr-tag-filter-label{flex:none;letter-spacing:.04em;opacity:.8;}
.sr-tag-mode{display:inline-flex;align-items:center;height:20px;padding:0 8px;border:1px solid color-mix(in oklab,var(--dsw-alias-brand-primary) 34%,var(--dsw-alias-border-l1));border-radius:99px;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 8%,transparent);color:var(--dsw-alias-brand-primary);font:inherit;font-size:9px;line-height:1;cursor:pointer;}
.sr-tag-mode::after{content:'⇄';margin-left:4px;font-size:9px;opacity:.72;}
.sr-tag-mode:hover{border-color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 14%,transparent);}
.sr-tag-manage{margin-left:auto;flex:none;}
.sr-tag-manager{width:min(388px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;padding:18px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 28px 74px -28px rgba(0,0,0,.62);animation:sr-pop .17s ease;}
.sr-tag-manager-hint{margin:0 0 10px;font-size:9.5px;line-height:1.65;color:var(--dsw-alias-label-secondary);}
.sr-tag-manager-list{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:2px;padding:2px 0;}
.sr-tag-manager-row{display:flex;align-items:center;gap:8px;padding:5px 2px 5px 6px;border-radius:8px;}
.sr-tag-manager-row:hover{background:color-mix(in oklab,var(--dsw-alias-label-primary) 5%,transparent);}
.sr-tag-manager-row[data-pending="true"]{background:color-mix(in oklab,var(--dsw-alias-state-error-primary) 7%,transparent);}
.sr-tag-manager-main{flex:1;min-width:0;display:flex;align-items:center;gap:6px;}
.sr-tag-manager-name{font-size:11px;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-tag-manager-input{flex:1;min-width:0;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-brand-primary);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;outline:none;}
.sr-tag-manager-actions{flex:none;display:flex;align-items:center;gap:2px;}
.sr-tag-manager-icon{width:22px;height:22px;}
.sr-link-btn.sr-link-primary{color:var(--dsw-alias-brand-primary);font-weight:500;}
.sr-tag-manager-empty{margin:14px 0;font-size:10px;text-align:center;color:var(--dsw-alias-label-secondary);}
.sr-tag-manager-foot{display:flex;justify-content:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 70%,transparent);}
.sr-tag-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 92%,transparent);border-radius:99px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:9.5px;line-height:1.5;cursor:pointer;transition:border-color .14s ease,color .14s ease,background .14s ease;}
.sr-tag-chip:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);}
.sr-tag-chip[aria-pressed="true"]{color:#f6f1e4;border-color:#4c8a75;background:#3f7d6b;font-weight:600;box-shadow:inset 0 1px 0 rgba(255,255,255,.14);}
.sr-tag-count{font-size:8.5px;opacity:.7;font-variant-numeric:tabular-nums;}
.sr-tag-editor{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:10px;}
.sr-tag-editor-label{font-size:9.5px;color:var(--dsw-alias-label-secondary);}
.sr-tag-editor .sr-tag-chip{padding-right:4px;}
.sr-tag-input{flex:1;min-width:116px;height:24px;padding:0 9px;border:1px dashed color-mix(in oklab,var(--dsw-alias-border-l2) 90%,transparent);border-radius:99px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:10px;outline:none;}
.sr-tag-input::placeholder{color:var(--dsw-alias-label-secondary);}
.sr-tag-input:focus{border-style:solid;border-color:var(--dsw-alias-brand-primary);}
.sr-tag-editor-hint{font-size:9px;color:var(--dsw-alias-label-secondary);}
.sr-tag-remove{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;opacity:.6;cursor:pointer;}
.sr-tag-remove:hover{opacity:1;background:color-mix(in oklab,var(--dsw-alias-brand-primary) 18%,transparent);}
.sr-card-backdrop{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,13,12,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);animation:sr-fade .15s ease;}
.sr-card-dialog{width:min(416px,100%);max-height:calc(100vh - 40px);overflow-y:auto;padding:20px;border-radius:20px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 85%,transparent);background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 94%,transparent);color:var(--dsw-alias-label-primary);box-shadow:0 32px 80px -20px rgba(0,0,0,.65);backdrop-filter:blur(24px) saturate(1.2);animation:sr-pop .18s cubic-bezier(.16,1,.3,1);}
.sr-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}
.sr-card-head h2{margin:0;font-family:${SERIF_FONT};font-size:17px;font-weight:600;letter-spacing:.05em;}
.sr-card-head p{margin:4px 0 0;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sr-card-stage{display:flex;align-items:center;justify-content:center;padding:12px;border-radius:14px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 62%,transparent);background:color-mix(in oklab,var(--dsw-alias-bg-layer-2) 72%,transparent);}
.sr-card-canvas{display:block;width:min(296px,100%);height:auto;border-radius:10px;box-shadow:0 20px 48px -16px rgba(0,0,0,.52);}
.sr-card-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:12px;}
.sr-card-themes{display:flex;align-items:center;flex-wrap:wrap;gap:6px;}
.sr-card-theme{display:inline-flex;align-items:center;gap:5px;padding:4px 9px 4px 6px;border:1px solid color-mix(in oklab,var(--dsw-alias-border-l1) 92%,transparent);border-radius:99px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:9.5px;line-height:1.5;cursor:pointer;transition:all .14s ease;}
.sr-card-theme:hover{border-color:var(--dsw-alias-border-l2);transform:translateY(-1px);}
.sr-card-theme[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary);box-shadow:0 2px 6px -1px color-mix(in oklab,var(--dsw-alias-brand-primary) 30%,transparent);}
.sr-card-theme-dot{width:11px;height:11px;border-radius:50%;border:1px solid rgba(0,0,0,.16);}
.sr-card-theme[data-theme="paper"] .sr-card-theme-dot{background:#f0e3cd;}
.sr-card-theme[data-theme="ink"] .sr-card-theme-dot{background:#20262a;}
.sr-card-theme[data-theme="celadon"] .sr-card-theme-dot{background:#dde8dc;}
.sr-card-theme[data-theme="sunset"] .sr-card-theme-dot{background:#f5decc;}
.sr-card-theme[data-theme="forest"] .sr-card-theme-dot{background:#1e3025;}
.sr-card-toggle{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.sr-card-toggle input{width:12px;height:12px;accent-color:var(--dsw-alias-brand-primary);}
.sr-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:12px;}
@media (hover:none){
  .sr-bookmark-row .sr-mini-action{opacity:1;}
}
@media (max-width:1080px){
  .sr-hero-grid{grid-template-columns:minmax(0,1fr) 246px;}
  .sr-hero-main{grid-template-columns:minmax(0,1fr) 264px;padding:26px;gap:18px;}
  .sr-hero-title{font-size:25px;}
  .sr-hero-copy p{font-size:11.5px;}
  .sr-continue-card .sr-cover{width:61px;flex-basis:61px;}
  .sr-continue-title{font-size:15px;}
}
@media (max-width:920px){
  .sr-brand{width:auto;min-width:0;max-width:none;flex:0 0 auto;}
  .sr-brand-sub{display:none;}
  .sr-header-inner{gap:14px;height:60px;}
  .sr-nav-item{padding:0 10px;font-size:11.5px;}
  .sr-search input{width:150px;}
  .sr-hero-grid{grid-template-columns:1fr;}
  .sr-hero-main{grid-template-columns:minmax(0,1fr) 280px;min-height:250px;padding:26px;gap:20px;}
  .sr-goal-card{min-height:0;display:grid;grid-template-columns:1fr auto;column-gap:16px;align-items:center;}
  .sr-goal-top{grid-column:1;grid-row:1;}
  .sr-goal-quote{grid-column:2;grid-row:1;margin:0;padding:0 0 0 18px;border-top:0;border-left:1px dashed var(--dsw-alias-border-l1);max-width:250px;}
  .sr-daily-wrap{grid-column:2;grid-row:1;margin:0;padding:0 0 0 18px;border-top:0;border-left:1px dashed var(--dsw-alias-border-l1);max-width:250px;}
  .sr-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .sr-chart-grid{grid-template-columns:1fr;}
  .sr-achievements-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .sr-rhythm-bars{gap:4px;}
  .sr-rhythm-slot{height:62px;}
  .sr-tod-row{grid-template-columns:42px minmax(0,1fr) 58px 30px;gap:7px;}
  .sr-page-area{padding-left:clamp(24px,5vw,58px);padding-right:clamp(24px,5vw,58px);}
}
@media (max-width:760px){
  .sr-notebook-tabs{width:100%;}
  .sr-notebook-tab{flex:1;justify-content:center;}
  .sr-notes-head-actions .sr-btn span{display:none;}
  .sr-bookmarks-grid{grid-template-columns:1fr;}
  .sr-note-editor-backdrop{padding:12px;}
  .sr-note-editor{max-height:calc(100vh - 24px);padding:17px;}
  .sr-tag-manager{max-height:calc(100vh - 24px);padding:16px;}
  .sr-header-inner{height:auto;min-height:56px;padding:10px 16px;flex-wrap:wrap;gap:8px;}
  .sr-brand-title{font-size:15px;}
  .sr-brand-mark{width:34px;height:34px;}
  .sr-nav{order:3;width:100%;justify-content:space-between;}
  .sr-nav-item{flex:1;justify-content:center;height:28px;}
  .sr-header-actions{gap:6px;}
  .sr-search{display:none;}
  .sr-mobile-search{display:flex;align-items:center;gap:7px;margin:0 16px 10px;padding:0 10px;height:32px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1) 80%,transparent);color:var(--dsw-alias-label-secondary);}
  .sr-mobile-search svg{flex:none;opacity:.8;}
  .sr-mobile-search input{appearance:none;width:100%;min-width:0;height:30px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-size:12.5px;outline:none;}
  .sr-mobile-search input::placeholder{color:var(--dsw-alias-label-secondary);}
  .sr-content{padding:20px 16px 48px;}
  .sr-hero-main{grid-template-columns:1fr;min-height:0;padding:23px 21px;gap:20px;}
  .sr-hero-copy{align-self:auto;}
  .sr-hero-title{font-size:24px;}
  .sr-continue-card{max-width:100%;}
  .sr-goal-card{display:flex;min-height:0;padding:18px;}
  .sr-goal-quote{display:none;}
  .sr-daily-wrap{display:none;}
  .sr-section-head h2{font-size:18px;}
  .sr-shelf-grid{grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:21px 13px;}
  .sr-cover-title{font-size:15px;right:15%;}
  .sr-cover-title--long{font-size:12px;letter-spacing:.07em;}
  .sr-cover-title--xlong{font-size:10.5px;letter-spacing:.04em;}
  .sr-cover-title--latin{font-size:12px;max-height:60%;}
  .sr-cover-author{font-size:7px;}
  .sr-cover-badge{font-size:6.5px;padding:2px 4px;}
  .sr-book-title{font-size:12.5px;}
  .sr-page-head{display:block;margin-bottom:17px;}
  .sr-page-head-stat{display:none;}
  .sr-notes-grid{grid-template-columns:1fr;}
  .sr-achievements-grid{grid-template-columns:1fr;}
  .sr-detail{width:100%;max-height:calc(100vh - 25px);flex-direction:column;}
  .sr-detail-left{flex:none;flex-direction:row;align-items:center;gap:14px;padding:16px 18px;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1);}
  .sr-detail-left .sr-cover{width:64px;flex:0 0 64px;margin:0;}
  .sr-cover-actions{flex-direction:column;align-items:flex-start;margin-top:0;}
  .sr-shelf-select, .sr-batch-dock, .sr-select-bar{
    bottom:12px;left:10px;right:10px;transform:none;width:auto;max-width:calc(100vw - 20px);padding:5px;border-radius:14px;
  }
  .sr-batch-dock-inner{width:100%;justify-content:space-between;gap:6px;}
  .sr-shelf-select-main{gap:5px;}
  .sr-shelf-select-links .sr-link-btn{padding:0 5px;font-size:10px;}
  .sr-shelf-select-actions{gap:2px;}
  .sr-bulk-action{height:28px;padding:0 7px;font-size:10.5px;}
  .sr-bulk-done{height:28px;padding:0 10px;font-size:10.5px;}
  .sr-shelf-bulk-tag, .sr-shelf-delete-bar, .sr-bulk-color-dock{
    width:calc(100vw - 24px);left:50%;transform:translateX(-50%);
  }

  .sr-detail-meta{text-align:left;flex:1;}
  .sr-detail-status-chip{align-self:center;display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:color-mix(in oklab,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-sans);font-size:8px;font-weight:600;letter-spacing:.04em;white-space:nowrap;}
.sr-detail-status-chip[data-status="reading"]{color:var(--dsw-alias-brand-primary);background:color-mix(in oklab,var(--dsw-alias-brand-primary) 9%,transparent);}
.sr-detail-status-chip[data-status="finished"]{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary));background:color-mix(in oklab,var(--dsw-alias-state-success-primary,var(--dsw-alias-brand-primary)) 9%,transparent);}
.sr-detail-status-chip[data-status="wishlist"]{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-brand-primary));background:color-mix(in oklab,var(--dsw-alias-state-warning-primary,var(--dsw-alias-brand-primary)) 9%,transparent);}
.sr-detail-meta strong{font-size:15px;}
  .sr-detail-progress{display:none;}
  .sr-detail-finish{width:auto;margin:0 0 0 auto;flex:none;font-size:8.5px;white-space:nowrap;}
  .sr-detail-restart{width:auto;margin:0 0 0 6px;flex:none;font-size:8.5px;white-space:nowrap;}
  .sr-detail-left .sr-cover--lg .sr-cover-title{font-size:11px;}
  .sr-detail-left .sr-cover--lg .sr-cover-glyph{font-size:70px;}
  .sr-detail-head{padding:12px 18px 0;}
  .sr-detail-meta{text-align:left;}
  .sr-detail-status-chip{align-self:flex-start;}
  .sr-detail-nav{padding:6px 18px 0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;}
  .sr-detail-nav::-webkit-scrollbar{display:none;}
  .sr-detail-nav button{flex:none;}
  .sr-detail-scroll{padding:13px 18px 0;}
  .sr-detail-bookstats{grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:13px;}
  .sr-detail-notes{margin-bottom:14px;}
  .sr-similar-list{grid-template-columns:repeat(3,minmax(0,1fr));}
  .sr-detail-bookstats>div{padding:7px 7px;}
  .sr-detail-bookstats strong{font-size:10.5px;}
  .sr-detail-foot{padding:12px 18px 16px;flex-wrap:wrap;}
  .sr-detail-remove-bar{padding:9px 18px;flex-wrap:wrap;}
  .sr-book-edit-form{padding:11px 18px 12px;}
  .sr-book-edit-fields{grid-template-columns:1fr;gap:8px;}
  .sr-detail-remove-actions{width:100%;justify-content:flex-end;}
  .sr-detail-foot-info{display:none;}
  .sr-detail-actions{width:100%;justify-content:flex-end;}
  .sr-detail-actions .sr-btn-primary{flex:1;}
  .sr-modal-backdrop{padding:12px;}
  .sr-paste-backdrop{padding:12px;}
  .sr-paste-card{max-height:calc(100vh - 24px);padding:16px;}
  .sr-paste-fields{grid-template-columns:1fr;}
  .sr-paste-text textarea{min-height:150px;max-height:32vh;}
  .sr-paste-foot span{display:none;}
  .sr-page-area{padding:73px 22px 70px;}
  .sr-reader-top{height:56px;gap:7px;padding:0 11px;}
  .sr-reader-top-center small{display:none;}
  .sr-reader-time{display:none;}
  .sr-reader-top-center strong{font-size:12px;}
  .sr-reader-back span{display:none;}
  .sr-reader-bottom{min-height:58px;padding:0 12px;}
  .sr-reader-bottom-inner{gap:5px;}
  .sr-reader-tool span{display:none;}
  .sr-reader-time{font-size:8px;color:var(--sr-muted);white-space:nowrap;opacity:.75;}
.sr-reader-progress-label{min-width:43px;font-size:9px;}
  .sr-reader-range-wrap{gap:6px;}
  .sr-page-meta{bottom:13px;font-size:9px;}
  .sr-reader-corner{bottom:74px;right:20px;}
  .sr-columns{font-size:17.5px;line-height:1.92;}
  .sr-chapter-title{font-size:1.55em;}
  .sr-drawer{width:min(350px,92%);}
  .sr-sheet{bottom:10px;width:calc(100% - 20px);padding:16px 15px 14px;border-radius:15px;}
  .sr-theme-grid{gap:5px;}
  .sr-theme-swatch{height:48px;}
  .sr-thought-card{padding:17px;}
  .sr-help-backdrop{padding:12px;}
  .sr-help-card{padding:16px 16px 13px;max-height:calc(100% - 10px);}
  .sr-shortcut-row{min-height:33px;padding:6px 0;font-size:10.5px;}
  .sr-stat-grid{gap:8px;}
  .sr-stat-card{padding:13px 12px 12px;}
  .sr-stat-value{font-size:19px;}
  .sr-bars{gap:7px;height:130px;}
  .sr-bar-slot{max-width:24px;}
  .sr-heatmap-weekdays,.sr-heatmap-grid{gap:4px;}
  .sr-heat-cell,.sr-heat-blank{height:29px;border-radius:5px;font-size:8px;}
  .sr-goal-adjust{font-size:9px;}
  .sr-tts-bar{bottom:8px;gap:7px;padding:7px 8px 7px 9px;}
  .sr-tts-copy strong{font-size:7.5px;}
  .sr-tts-copy span{font-size:9.5px;}
  .sr-tts-timer{width:30px;min-width:30px;padding:0;display:inline-flex;align-items:center;justify-content:center;gap:0;font-size:8px;}
.sr-tts-timer[data-on="true"]{width:auto;min-width:34px;padding:0 6px;color:var(--sr-accent);border-color:color-mix(in srgb,var(--sr-accent) 35%,var(--sr-line));}
.sr-tts-rate{min-width:30px;font-size:8px;}
  .sr-brand-import-label{display:none;}
  .sr-brand-import-pill{padding:3px 7px 4px 6px;}
  .sr-import-progress{left:0;top:calc(100% + 6px);width:calc(100vw - 32px);}
}
@media (max-width:460px){
  .sr-shelf-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .sr-book-pct{display:none;}
  .sr-book-row{padding:8px 9px;gap:9px;}
  .sr-content-result{padding:9px 10px;}
  .sr-content-head{padding:7px 10px;}
  .sr-book-row .sr-cover--sm{width:36px;flex-basis:36px;}
  .sr-book-row-title>span{font-size:12.5px;}
  .sr-book-row-pct{display:none;}
  .sr-book-import-icon{width:36px;height:46px;}
  .sr-view-toggle{order:-1;}
  .sr-import-title{font-size:11px;}
  .sr-import-text{font-size:8.5px;}
  .sr-continue-card .sr-cover{width:52px;flex-basis:52px;}
  .sr-continue-title{font-size:14px;}
  .sr-hero-title{font-size:22px;}
  .sr-nav-count{display:none;}
  .sr-goal-top{gap:12px;}
  .sr-ring-wrap,.sr-ring{width:59px;height:59px;}
  .sr-goal-time{font-size:19px;}
  .sr-page-area{padding-left:18px;padding-right:18px;}
  .sr-reader-icon{width:30px;height:30px;}
  .sr-theme-swatch::before{display:none;}
  .sr-setting-label{font-size:9px;}
  .sr-palette-trigger kbd{display:none;}
}
@media (max-width:460px){
  .sr-card-backdrop{padding:14px;}
  .sr-card-dialog{padding:14px;border-radius:15px;}
  .sr-card-canvas{width:100%;}
  .sr-card-actions{justify-content:space-between;}
  .sr-tag-input{min-width:86px;}
}
@media (prefers-reduced-motion:reduce){
  .sr-app *,.sr-app *::before,.sr-app *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important;}
  .sr-page-track{transition:none !important;}
}
@media (forced-colors: active){
  .sr-reader-tool,.sr-reader-btn,.sr-page-edge,.sr-font-step,.sr-sheet,.sr-jump-return{border:1px solid ButtonBorder !important;}
  .sr-reader-btn--primary{background:Highlight !important;color:HighlightText !important;}
  :focus-visible{outline:2px solid Highlight !important;}
}

/* Round 41 & 48: RTL Typography & Low-End Hardware Degradation */
.sr-columns[dir="rtl"], [dir="rtl"] .sr-columns {
  direction: rtl;
  text-align: right;
  unicode-bidi: isolate;
}
.sr-columns[dir="rtl"] blockquote {
  border-left: none;
  border-right: 3px solid var(--sr-accent);
  padding-left: 1em;
  padding-right: 1.2em;
}
.sr-reader.sr-perf-lite,
.sr-perf-lite .sr-glass,
.sr-perf-lite .sr-reader-top,
.sr-perf-lite .sr-reader-bottom,
.sr-perf-lite .sr-drawer,
.sr-perf-lite .sr-sheet {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
  transition: none !important;
}
`;
