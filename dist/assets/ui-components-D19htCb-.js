import{r as c,$ as rr,a as nr,b as or}from"./react-vendor-CGP8wbrH.js";var it={exports:{}},fe={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ar=c,sr=Symbol.for("react.element"),ir=Symbol.for("react.fragment"),cr=Object.prototype.hasOwnProperty,lr=ar.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,dr={key:!0,ref:!0,__self:!0,__source:!0};function ct(e,t,r){var n,o={},a=null,i=null;r!==void 0&&(a=""+r),t.key!==void 0&&(a=""+t.key),t.ref!==void 0&&(i=t.ref);for(n in t)cr.call(t,n)&&!dr.hasOwnProperty(n)&&(o[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)o[n]===void 0&&(o[n]=t[n]);return{$$typeof:sr,type:e,key:a,ref:i,props:o,_owner:lr.current}}fe.Fragment=ir;fe.jsx=ct;fe.jsxs=ct;it.exports=fe;var g=it.exports,Oe=function(e,t){return Oe=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(r,n){r.__proto__=n}||function(r,n){for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[o]=n[o])},Oe(e,t)};function _o(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");Oe(e,t);function r(){this.constructor=e}e.prototype=t===null?Object.create(t):(r.prototype=t.prototype,new r)}var L=function(){return L=Object.assign||function(t){for(var r,n=1,o=arguments.length;n<o;n++){r=arguments[n];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t},L.apply(this,arguments)};function lt(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,n=Object.getOwnPropertySymbols(e);o<n.length;o++)t.indexOf(n[o])<0&&Object.prototype.propertyIsEnumerable.call(e,n[o])&&(r[n[o]]=e[n[o]]);return r}function Io(e){var t=typeof Symbol=="function"&&Symbol.iterator,r=t&&e[t],n=0;if(r)return r.call(e);if(e&&typeof e.length=="number")return{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")}function Fo(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),o,a=[],i;try{for(;(t===void 0||t-- >0)&&!(o=n.next()).done;)a.push(o.value)}catch(s){i={error:s}}finally{try{o&&!o.done&&(r=n.return)&&r.call(n)}finally{if(i)throw i.error}}return a}function ur(e,t,r){if(r||arguments.length===2)for(var n=0,o=t.length,a;n<o;n++)(a||!(n in t))&&(a||(a=Array.prototype.slice.call(t,0,n)),a[n]=t[n]);return e.concat(a||Array.prototype.slice.call(t))}function V(e,t,{checkForDefaultPrevented:r=!0}={}){return function(o){if(e==null||e(o),r===!1||!o.defaultPrevented)return t==null?void 0:t(o)}}function fr(e,t){const r=c.createContext(t),n=a=>{const{children:i,...s}=a,f=c.useMemo(()=>s,Object.values(s));return g.jsx(r.Provider,{value:f,children:i})};n.displayName=e+"Provider";function o(a){const i=c.useContext(r);if(i)return i;if(t!==void 0)return t;throw new Error(`\`${a}\` must be used within \`${e}\``)}return[n,o]}function pr(e,t=[]){let r=[];function n(a,i){const s=c.createContext(i),f=r.length;r=[...r,i];const d=h=>{var v;const{scope:m,children:b,...k}=h,u=((v=m==null?void 0:m[e])==null?void 0:v[f])||s,y=c.useMemo(()=>k,Object.values(k));return g.jsx(u.Provider,{value:y,children:b})};d.displayName=a+"Provider";function p(h,m){var u;const b=((u=m==null?void 0:m[e])==null?void 0:u[f])||s,k=c.useContext(b);if(k)return k;if(i!==void 0)return i;throw new Error(`\`${h}\` must be used within \`${a}\``)}return[d,p]}const o=()=>{const a=r.map(i=>c.createContext(i));return function(s){const f=(s==null?void 0:s[e])||a;return c.useMemo(()=>({[`__scope${e}`]:{...s,[e]:f}}),[s,f])}};return o.scopeName=e,[n,hr(o,...t)]}function hr(...e){const t=e[0];if(e.length===1)return t;const r=()=>{const n=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(a){const i=n.reduce((s,{useScope:f,scopeName:d})=>{const h=f(a)[`__scope${d}`];return{...s,...h}},{});return c.useMemo(()=>({[`__scope${t.scopeName}`]:i}),[i])}};return r.scopeName=t.scopeName,r}function yr(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}function dt(...e){return t=>e.forEach(r=>yr(r,t))}function q(...e){return c.useCallback(dt(...e),e)}var pe=c.forwardRef((e,t)=>{const{children:r,...n}=e,o=c.Children.toArray(r),a=o.find(gr);if(a){const i=a.props.children,s=o.map(f=>f===a?c.Children.count(i)>1?c.Children.only(null):c.isValidElement(i)?i.props.children:null:f);return g.jsx(De,{...n,ref:t,children:c.isValidElement(i)?c.cloneElement(i,void 0,s):null})}return g.jsx(De,{...n,ref:t,children:r})});pe.displayName="Slot";var De=c.forwardRef((e,t)=>{const{children:r,...n}=e;if(c.isValidElement(r)){const o=br(r);return c.cloneElement(r,{...vr(n,r.props),ref:t?dt(t,o):o})}return c.Children.count(r)>1?c.Children.only(null):null});De.displayName="SlotClone";var mr=({children:e})=>g.jsx(g.Fragment,{children:e});function gr(e){return c.isValidElement(e)&&e.type===mr}function vr(e,t){const r={...t};for(const n in t){const o=e[n],a=t[n];/^on[A-Z]/.test(n)?o&&a?r[n]=(...s)=>{a(...s),o(...s)}:o&&(r[n]=o):n==="style"?r[n]={...o,...a}:n==="className"&&(r[n]=[o,a].filter(Boolean).join(" "))}return{...e,...r}}function br(e){var n,o;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}var de=globalThis!=null&&globalThis.document?c.useLayoutEffect:()=>{},xr=rr.useId||(()=>{}),kr=0;function we(e){const[t,r]=c.useState(xr());return de(()=>{e||r(n=>n??String(kr++))},[e]),e||(t?`radix-${t}`:"")}var wr=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],_=wr.reduce((e,t)=>{const r=c.forwardRef((n,o)=>{const{asChild:a,...i}=n,s=a?pe:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),g.jsx(s,{...i,ref:o})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function Mr(e,t){e&&nr.flushSync(()=>e.dispatchEvent(t))}function U(e){const t=c.useRef(e);return c.useEffect(()=>{t.current=e}),c.useMemo(()=>(...r)=>{var n;return(n=t.current)==null?void 0:n.call(t,...r)},[])}function Cr({prop:e,defaultProp:t,onChange:r=()=>{}}){const[n,o]=Er({defaultProp:t,onChange:r}),a=e!==void 0,i=a?e:n,s=U(r),f=c.useCallback(d=>{if(a){const h=typeof d=="function"?d(e):d;h!==e&&s(h)}else o(d)},[a,e,o,s]);return[i,f]}function Er({defaultProp:e,onChange:t}){const r=c.useState(e),[n]=r,o=c.useRef(n),a=U(t);return c.useEffect(()=>{o.current!==n&&(a(n),o.current=n)},[n,o,a]),r}function Sr(e,t){return c.useReducer((r,n)=>t[r][n]??r,e)}var he=e=>{const{present:t,children:r}=e,n=Nr(t),o=typeof r=="function"?r({present:n.isPresent}):c.Children.only(r),a=q(n.ref,Ar(o));return typeof r=="function"||n.isPresent?c.cloneElement(o,{ref:a}):null};he.displayName="Presence";function Nr(e){const[t,r]=c.useState(),n=c.useRef({}),o=c.useRef(e),a=c.useRef("none"),i=e?"mounted":"unmounted",[s,f]=Sr(i,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return c.useEffect(()=>{const d=ne(n.current);a.current=s==="mounted"?d:"none"},[s]),de(()=>{const d=n.current,p=o.current;if(p!==e){const m=a.current,b=ne(d);e?f("MOUNT"):b==="none"||(d==null?void 0:d.display)==="none"?f("UNMOUNT"):f(p&&m!==b?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,f]),de(()=>{if(t){let d;const p=t.ownerDocument.defaultView??window,h=b=>{const u=ne(n.current).includes(b.animationName);if(b.target===t&&u&&(f("ANIMATION_END"),!o.current)){const y=t.style.animationFillMode;t.style.animationFillMode="forwards",d=p.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=y)})}},m=b=>{b.target===t&&(a.current=ne(n.current))};return t.addEventListener("animationstart",m),t.addEventListener("animationcancel",h),t.addEventListener("animationend",h),()=>{p.clearTimeout(d),t.removeEventListener("animationstart",m),t.removeEventListener("animationcancel",h),t.removeEventListener("animationend",h)}}else f("ANIMATION_END")},[t,f]),{isPresent:["mounted","unmountSuspended"].includes(s),ref:c.useCallback(d=>{d&&(n.current=getComputedStyle(d)),r(d)},[])}}function ne(e){return(e==null?void 0:e.animationName)||"none"}function Ar(e){var n,o;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}function ut(e){var t,r,n="";if(typeof e=="string"||typeof e=="number")n+=e;else if(typeof e=="object")if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(r=ut(e[t]))&&(n&&(n+=" "),n+=r)}else for(r in e)e[r]&&(n&&(n+=" "),n+=r);return n}function ft(){for(var e,t,r=0,n="",o=arguments.length;r<o;r++)(e=arguments[r])&&(t=ut(e))&&(n&&(n+=" "),n+=t);return n}const ze="-",Rr=e=>{const t=Or(e),{conflictingClassGroups:r,conflictingClassGroupModifiers:n}=e;return{getClassGroupId:i=>{const s=i.split(ze);return s[0]===""&&s.length!==1&&s.shift(),pt(s,t)||Pr(i)},getConflictingClassGroupIds:(i,s)=>{const f=r[i]||[];return s&&n[i]?[...f,...n[i]]:f}}},pt=(e,t)=>{var i;if(e.length===0)return t.classGroupId;const r=e[0],n=t.nextPart.get(r),o=n?pt(e.slice(1),n):void 0;if(o)return o;if(t.validators.length===0)return;const a=e.join(ze);return(i=t.validators.find(({validator:s})=>s(a)))==null?void 0:i.classGroupId},qe=/^\[(.+)\]$/,Pr=e=>{if(qe.test(e)){const t=qe.exec(e)[1],r=t==null?void 0:t.substring(0,t.indexOf(":"));if(r)return"arbitrary.."+r}},Or=e=>{const{theme:t,prefix:r}=e,n={nextPart:new Map,validators:[]};return Lr(Object.entries(e.classGroups),r).forEach(([a,i])=>{Le(i,n,a,t)}),n},Le=(e,t,r,n)=>{e.forEach(o=>{if(typeof o=="string"){const a=o===""?t:Ge(t,o);a.classGroupId=r;return}if(typeof o=="function"){if(Dr(o)){Le(o(n),t,r,n);return}t.validators.push({validator:o,classGroupId:r});return}Object.entries(o).forEach(([a,i])=>{Le(i,Ge(t,a),r,n)})})},Ge=(e,t)=>{let r=e;return t.split(ze).forEach(n=>{r.nextPart.has(n)||r.nextPart.set(n,{nextPart:new Map,validators:[]}),r=r.nextPart.get(n)}),r},Dr=e=>e.isThemeGetter,Lr=(e,t)=>t?e.map(([r,n])=>{const o=n.map(a=>typeof a=="string"?t+a:typeof a=="object"?Object.fromEntries(Object.entries(a).map(([i,s])=>[t+i,s])):a);return[r,o]}):e,jr=e=>{if(e<1)return{get:()=>{},set:()=>{}};let t=0,r=new Map,n=new Map;const o=(a,i)=>{r.set(a,i),t++,t>e&&(t=0,n=r,r=new Map)};return{get(a){let i=r.get(a);if(i!==void 0)return i;if((i=n.get(a))!==void 0)return o(a,i),i},set(a,i){r.has(a)?r.set(a,i):o(a,i)}}},ht="!",Tr=e=>{const{separator:t,experimentalParseClassName:r}=e,n=t.length===1,o=t[0],a=t.length,i=s=>{const f=[];let d=0,p=0,h;for(let y=0;y<s.length;y++){let v=s[y];if(d===0){if(v===o&&(n||s.slice(y,y+a)===t)){f.push(s.slice(p,y)),p=y+a;continue}if(v==="/"){h=y;continue}}v==="["?d++:v==="]"&&d--}const m=f.length===0?s:s.substring(p),b=m.startsWith(ht),k=b?m.substring(1):m,u=h&&h>p?h-p:void 0;return{modifiers:f,hasImportantModifier:b,baseClassName:k,maybePostfixModifierPosition:u}};return r?s=>r({className:s,parseClassName:i}):i},zr=e=>{if(e.length<=1)return e;const t=[];let r=[];return e.forEach(n=>{n[0]==="["?(t.push(...r.sort(),n),r=[]):r.push(n)}),t.push(...r.sort()),t},_r=e=>({cache:jr(e.cacheSize),parseClassName:Tr(e),...Rr(e)}),Ir=/\s+/,Fr=(e,t)=>{const{parseClassName:r,getClassGroupId:n,getConflictingClassGroupIds:o}=t,a=[],i=e.trim().split(Ir);let s="";for(let f=i.length-1;f>=0;f-=1){const d=i[f],{modifiers:p,hasImportantModifier:h,baseClassName:m,maybePostfixModifierPosition:b}=r(d);let k=!!b,u=n(k?m.substring(0,b):m);if(!u){if(!k){s=d+(s.length>0?" "+s:s);continue}if(u=n(m),!u){s=d+(s.length>0?" "+s:s);continue}k=!1}const y=zr(p).join(":"),v=h?y+ht:y,w=v+u;if(a.includes(w))continue;a.push(w);const C=o(u,k);for(let M=0;M<C.length;++M){const S=C[M];a.push(v+S)}s=d+(s.length>0?" "+s:s)}return s};function Wr(){let e=0,t,r,n="";for(;e<arguments.length;)(t=arguments[e++])&&(r=yt(t))&&(n&&(n+=" "),n+=r);return n}const yt=e=>{if(typeof e=="string")return e;let t,r="";for(let n=0;n<e.length;n++)e[n]&&(t=yt(e[n]))&&(r&&(r+=" "),r+=t);return r};function Vr(e,...t){let r,n,o,a=i;function i(f){const d=t.reduce((p,h)=>h(p),e());return r=_r(d),n=r.cache.get,o=r.cache.set,a=s,s(f)}function s(f){const d=n(f);if(d)return d;const p=Fr(f,r);return o(f,p),p}return function(){return a(Wr.apply(null,arguments))}}const N=e=>{const t=r=>r[e]||[];return t.isThemeGetter=!0,t},mt=/^\[(?:([a-z-]+):)?(.+)\]$/i,Br=/^\d+\/\d+$/,Ur=new Set(["px","full","screen"]),Hr=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,qr=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Gr=/^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,$r=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Kr=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,z=e=>X(e)||Ur.has(e)||Br.test(e),I=e=>Y(e,"length",rn),X=e=>!!e&&!Number.isNaN(Number(e)),Me=e=>Y(e,"number",X),J=e=>!!e&&Number.isInteger(Number(e)),Xr=e=>e.endsWith("%")&&X(e.slice(0,-1)),x=e=>mt.test(e),F=e=>Hr.test(e),Zr=new Set(["length","size","percentage"]),Yr=e=>Y(e,Zr,gt),Qr=e=>Y(e,"position",gt),Jr=new Set(["image","url"]),en=e=>Y(e,Jr,on),tn=e=>Y(e,"",nn),ee=()=>!0,Y=(e,t,r)=>{const n=mt.exec(e);return n?n[1]?typeof t=="string"?n[1]===t:t.has(n[1]):r(n[2]):!1},rn=e=>qr.test(e)&&!Gr.test(e),gt=()=>!1,nn=e=>$r.test(e),on=e=>Kr.test(e),an=()=>{const e=N("colors"),t=N("spacing"),r=N("blur"),n=N("brightness"),o=N("borderColor"),a=N("borderRadius"),i=N("borderSpacing"),s=N("borderWidth"),f=N("contrast"),d=N("grayscale"),p=N("hueRotate"),h=N("invert"),m=N("gap"),b=N("gradientColorStops"),k=N("gradientColorStopPositions"),u=N("inset"),y=N("margin"),v=N("opacity"),w=N("padding"),C=N("saturate"),M=N("scale"),S=N("sepia"),R=N("skew"),E=N("space"),P=N("translate"),j=()=>["auto","contain","none"],B=()=>["auto","hidden","clip","visible","scroll"],xe=()=>["auto",x,t],A=()=>[x,t],Ve=()=>["",z,I],te=()=>["auto",X,x],Be=()=>["bottom","center","left","left-bottom","left-top","right","right-bottom","right-top","top"],re=()=>["solid","dashed","dotted","double","none"],Ue=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],ke=()=>["start","end","center","between","around","evenly","stretch"],Q=()=>["","0",x],He=()=>["auto","avoid","all","avoid-page","page","left","right","column"],T=()=>[X,x];return{cacheSize:500,separator:":",theme:{colors:[ee],spacing:[z,I],blur:["none","",F,x],brightness:T(),borderColor:[e],borderRadius:["none","","full",F,x],borderSpacing:A(),borderWidth:Ve(),contrast:T(),grayscale:Q(),hueRotate:T(),invert:Q(),gap:A(),gradientColorStops:[e],gradientColorStopPositions:[Xr,I],inset:xe(),margin:xe(),opacity:T(),padding:A(),saturate:T(),scale:T(),sepia:Q(),skew:T(),space:A(),translate:A()},classGroups:{aspect:[{aspect:["auto","square","video",x]}],container:["container"],columns:[{columns:[F]}],"break-after":[{"break-after":He()}],"break-before":[{"break-before":He()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:[...Be(),x]}],overflow:[{overflow:B()}],"overflow-x":[{"overflow-x":B()}],"overflow-y":[{"overflow-y":B()}],overscroll:[{overscroll:j()}],"overscroll-x":[{"overscroll-x":j()}],"overscroll-y":[{"overscroll-y":j()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:[u]}],"inset-x":[{"inset-x":[u]}],"inset-y":[{"inset-y":[u]}],start:[{start:[u]}],end:[{end:[u]}],top:[{top:[u]}],right:[{right:[u]}],bottom:[{bottom:[u]}],left:[{left:[u]}],visibility:["visible","invisible","collapse"],z:[{z:["auto",J,x]}],basis:[{basis:xe()}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["wrap","wrap-reverse","nowrap"]}],flex:[{flex:["1","auto","initial","none",x]}],grow:[{grow:Q()}],shrink:[{shrink:Q()}],order:[{order:["first","last","none",J,x]}],"grid-cols":[{"grid-cols":[ee]}],"col-start-end":[{col:["auto",{span:["full",J,x]},x]}],"col-start":[{"col-start":te()}],"col-end":[{"col-end":te()}],"grid-rows":[{"grid-rows":[ee]}],"row-start-end":[{row:["auto",{span:[J,x]},x]}],"row-start":[{"row-start":te()}],"row-end":[{"row-end":te()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":["auto","min","max","fr",x]}],"auto-rows":[{"auto-rows":["auto","min","max","fr",x]}],gap:[{gap:[m]}],"gap-x":[{"gap-x":[m]}],"gap-y":[{"gap-y":[m]}],"justify-content":[{justify:["normal",...ke()]}],"justify-items":[{"justify-items":["start","end","center","stretch"]}],"justify-self":[{"justify-self":["auto","start","end","center","stretch"]}],"align-content":[{content:["normal",...ke(),"baseline"]}],"align-items":[{items:["start","end","center","baseline","stretch"]}],"align-self":[{self:["auto","start","end","center","stretch","baseline"]}],"place-content":[{"place-content":[...ke(),"baseline"]}],"place-items":[{"place-items":["start","end","center","baseline","stretch"]}],"place-self":[{"place-self":["auto","start","end","center","stretch"]}],p:[{p:[w]}],px:[{px:[w]}],py:[{py:[w]}],ps:[{ps:[w]}],pe:[{pe:[w]}],pt:[{pt:[w]}],pr:[{pr:[w]}],pb:[{pb:[w]}],pl:[{pl:[w]}],m:[{m:[y]}],mx:[{mx:[y]}],my:[{my:[y]}],ms:[{ms:[y]}],me:[{me:[y]}],mt:[{mt:[y]}],mr:[{mr:[y]}],mb:[{mb:[y]}],ml:[{ml:[y]}],"space-x":[{"space-x":[E]}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":[E]}],"space-y-reverse":["space-y-reverse"],w:[{w:["auto","min","max","fit","svw","lvw","dvw",x,t]}],"min-w":[{"min-w":[x,t,"min","max","fit"]}],"max-w":[{"max-w":[x,t,"none","full","min","max","fit","prose",{screen:[F]},F]}],h:[{h:[x,t,"auto","min","max","fit","svh","lvh","dvh"]}],"min-h":[{"min-h":[x,t,"min","max","fit","svh","lvh","dvh"]}],"max-h":[{"max-h":[x,t,"min","max","fit","svh","lvh","dvh"]}],size:[{size:[x,t,"auto","min","max","fit"]}],"font-size":[{text:["base",F,I]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:["thin","extralight","light","normal","medium","semibold","bold","extrabold","black",Me]}],"font-family":[{font:[ee]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractons"],tracking:[{tracking:["tighter","tight","normal","wide","wider","widest",x]}],"line-clamp":[{"line-clamp":["none",X,Me]}],leading:[{leading:["none","tight","snug","normal","relaxed","loose",z,x]}],"list-image":[{"list-image":["none",x]}],"list-style-type":[{list:["none","disc","decimal",x]}],"list-style-position":[{list:["inside","outside"]}],"placeholder-color":[{placeholder:[e]}],"placeholder-opacity":[{"placeholder-opacity":[v]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"text-color":[{text:[e]}],"text-opacity":[{"text-opacity":[v]}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...re(),"wavy"]}],"text-decoration-thickness":[{decoration:["auto","from-font",z,I]}],"underline-offset":[{"underline-offset":["auto",z,x]}],"text-decoration-color":[{decoration:[e]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:A()}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",x]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",x]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-opacity":[{"bg-opacity":[v]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:[...Be(),Qr]}],"bg-repeat":[{bg:["no-repeat",{repeat:["","x","y","round","space"]}]}],"bg-size":[{bg:["auto","cover","contain",Yr]}],"bg-image":[{bg:["none",{"gradient-to":["t","tr","r","br","b","bl","l","tl"]},en]}],"bg-color":[{bg:[e]}],"gradient-from-pos":[{from:[k]}],"gradient-via-pos":[{via:[k]}],"gradient-to-pos":[{to:[k]}],"gradient-from":[{from:[b]}],"gradient-via":[{via:[b]}],"gradient-to":[{to:[b]}],rounded:[{rounded:[a]}],"rounded-s":[{"rounded-s":[a]}],"rounded-e":[{"rounded-e":[a]}],"rounded-t":[{"rounded-t":[a]}],"rounded-r":[{"rounded-r":[a]}],"rounded-b":[{"rounded-b":[a]}],"rounded-l":[{"rounded-l":[a]}],"rounded-ss":[{"rounded-ss":[a]}],"rounded-se":[{"rounded-se":[a]}],"rounded-ee":[{"rounded-ee":[a]}],"rounded-es":[{"rounded-es":[a]}],"rounded-tl":[{"rounded-tl":[a]}],"rounded-tr":[{"rounded-tr":[a]}],"rounded-br":[{"rounded-br":[a]}],"rounded-bl":[{"rounded-bl":[a]}],"border-w":[{border:[s]}],"border-w-x":[{"border-x":[s]}],"border-w-y":[{"border-y":[s]}],"border-w-s":[{"border-s":[s]}],"border-w-e":[{"border-e":[s]}],"border-w-t":[{"border-t":[s]}],"border-w-r":[{"border-r":[s]}],"border-w-b":[{"border-b":[s]}],"border-w-l":[{"border-l":[s]}],"border-opacity":[{"border-opacity":[v]}],"border-style":[{border:[...re(),"hidden"]}],"divide-x":[{"divide-x":[s]}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":[s]}],"divide-y-reverse":["divide-y-reverse"],"divide-opacity":[{"divide-opacity":[v]}],"divide-style":[{divide:re()}],"border-color":[{border:[o]}],"border-color-x":[{"border-x":[o]}],"border-color-y":[{"border-y":[o]}],"border-color-s":[{"border-s":[o]}],"border-color-e":[{"border-e":[o]}],"border-color-t":[{"border-t":[o]}],"border-color-r":[{"border-r":[o]}],"border-color-b":[{"border-b":[o]}],"border-color-l":[{"border-l":[o]}],"divide-color":[{divide:[o]}],"outline-style":[{outline:["",...re()]}],"outline-offset":[{"outline-offset":[z,x]}],"outline-w":[{outline:[z,I]}],"outline-color":[{outline:[e]}],"ring-w":[{ring:Ve()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:[e]}],"ring-opacity":[{"ring-opacity":[v]}],"ring-offset-w":[{"ring-offset":[z,I]}],"ring-offset-color":[{"ring-offset":[e]}],shadow:[{shadow:["","inner","none",F,tn]}],"shadow-color":[{shadow:[ee]}],opacity:[{opacity:[v]}],"mix-blend":[{"mix-blend":[...Ue(),"plus-lighter","plus-darker"]}],"bg-blend":[{"bg-blend":Ue()}],filter:[{filter:["","none"]}],blur:[{blur:[r]}],brightness:[{brightness:[n]}],contrast:[{contrast:[f]}],"drop-shadow":[{"drop-shadow":["","none",F,x]}],grayscale:[{grayscale:[d]}],"hue-rotate":[{"hue-rotate":[p]}],invert:[{invert:[h]}],saturate:[{saturate:[C]}],sepia:[{sepia:[S]}],"backdrop-filter":[{"backdrop-filter":["","none"]}],"backdrop-blur":[{"backdrop-blur":[r]}],"backdrop-brightness":[{"backdrop-brightness":[n]}],"backdrop-contrast":[{"backdrop-contrast":[f]}],"backdrop-grayscale":[{"backdrop-grayscale":[d]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[p]}],"backdrop-invert":[{"backdrop-invert":[h]}],"backdrop-opacity":[{"backdrop-opacity":[v]}],"backdrop-saturate":[{"backdrop-saturate":[C]}],"backdrop-sepia":[{"backdrop-sepia":[S]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":[i]}],"border-spacing-x":[{"border-spacing-x":[i]}],"border-spacing-y":[{"border-spacing-y":[i]}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["none","all","","colors","opacity","shadow","transform",x]}],duration:[{duration:T()}],ease:[{ease:["linear","in","out","in-out",x]}],delay:[{delay:T()}],animate:[{animate:["none","spin","ping","pulse","bounce",x]}],transform:[{transform:["","gpu","none"]}],scale:[{scale:[M]}],"scale-x":[{"scale-x":[M]}],"scale-y":[{"scale-y":[M]}],rotate:[{rotate:[J,x]}],"translate-x":[{"translate-x":[P]}],"translate-y":[{"translate-y":[P]}],"skew-x":[{"skew-x":[R]}],"skew-y":[{"skew-y":[R]}],"transform-origin":[{origin:["center","top","top-right","right","bottom-right","bottom","bottom-left","left","top-left",x]}],accent:[{accent:["auto",e]}],appearance:[{appearance:["none","auto"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",x]}],"caret-color":[{caret:[e]}],"pointer-events":[{"pointer-events":["none","auto"]}],resize:[{resize:["none","y","x",""]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scroll-m":[{"scroll-m":A()}],"scroll-mx":[{"scroll-mx":A()}],"scroll-my":[{"scroll-my":A()}],"scroll-ms":[{"scroll-ms":A()}],"scroll-me":[{"scroll-me":A()}],"scroll-mt":[{"scroll-mt":A()}],"scroll-mr":[{"scroll-mr":A()}],"scroll-mb":[{"scroll-mb":A()}],"scroll-ml":[{"scroll-ml":A()}],"scroll-p":[{"scroll-p":A()}],"scroll-px":[{"scroll-px":A()}],"scroll-py":[{"scroll-py":A()}],"scroll-ps":[{"scroll-ps":A()}],"scroll-pe":[{"scroll-pe":A()}],"scroll-pt":[{"scroll-pt":A()}],"scroll-pr":[{"scroll-pr":A()}],"scroll-pb":[{"scroll-pb":A()}],"scroll-pl":[{"scroll-pl":A()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",x]}],fill:[{fill:[e,"none"]}],"stroke-w":[{stroke:[z,I,Me]}],stroke:[{stroke:[e,"none"]}],sr:["sr-only","not-sr-only"],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","start","end","top","right","bottom","left"],"inset-x":["right","left"],"inset-y":["top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pt","pr","pb","pl"],px:["pr","pl"],py:["pt","pb"],m:["mx","my","ms","me","mt","mr","mb","ml"],mx:["mr","ml"],my:["mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-s","border-w-e","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-r","border-w-l"],"border-w-y":["border-w-t","border-w-b"],"border-color":["border-color-s","border-color-e","border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-r","border-color-l"],"border-color-y":["border-color-t","border-color-b"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-mr","scroll-ml"],"scroll-my":["scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-pr","scroll-pl"],"scroll-py":["scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]}}},sn=Vr(an);function O(...e){return sn(ft(e))}const $e=e=>typeof e=="boolean"?`${e}`:e===0?"0":e,Ke=ft,vt=(e,t)=>r=>{var n;if((t==null?void 0:t.variants)==null)return Ke(e,r==null?void 0:r.class,r==null?void 0:r.className);const{variants:o,defaultVariants:a}=t,i=Object.keys(o).map(d=>{const p=r==null?void 0:r[d],h=a==null?void 0:a[d];if(p===null)return null;const m=$e(p)||$e(h);return o[d][m]}),s=r&&Object.entries(r).reduce((d,p)=>{let[h,m]=p;return m===void 0||(d[h]=m),d},{}),f=t==null||(n=t.compoundVariants)===null||n===void 0?void 0:n.reduce((d,p)=>{let{class:h,className:m,...b}=p;return Object.entries(b).every(k=>{let[u,y]=k;return Array.isArray(y)?y.includes({...a,...s}[u]):{...a,...s}[u]===y})?[...d,h,m]:d},[]);return Ke(e,i,f,r==null?void 0:r.class,r==null?void 0:r.className)},cn=vt("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),ln=c.forwardRef(({className:e,variant:t,size:r,asChild:n=!1,...o},a)=>{const i=n?pe:"button";return g.jsx(i,{className:O(cn({variant:t,size:r,className:e})),ref:a,...o})});ln.displayName="Button";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),bt=(...e)=>e.filter((t,r,n)=>!!t&&t.trim()!==""&&n.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var un={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=c.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:o="",children:a,iconNode:i,...s},f)=>c.createElement("svg",{ref:f,...un,width:t,height:t,stroke:e,strokeWidth:n?Number(r)*24/Number(t):r,className:bt("lucide",o),...s},[...i.map(([d,p])=>c.createElement(d,p)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=(e,t)=>{const r=c.forwardRef(({className:n,...o},a)=>c.createElement(fn,{ref:a,iconNode:t,className:bt(`lucide-${dn(e)}`,n),...o}));return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wo=l("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vo=l("ArrowDownLeft",[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bo=l("ArrowDownNarrowWide",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"M11 4h4",key:"6d7r33"}],["path",{d:"M11 8h7",key:"djye34"}],["path",{d:"M11 12h10",key:"1438ji"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uo=l("ArrowDownUp",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ho=l("ArrowDownWideNarrow",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"M11 4h10",key:"1w87gc"}],["path",{d:"M11 8h7",key:"djye34"}],["path",{d:"M11 12h4",key:"q8tih4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qo=l("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Go=l("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $o=l("ArrowUpNarrowWide",[["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}],["path",{d:"M11 12h4",key:"q8tih4"}],["path",{d:"M11 16h7",key:"uosisv"}],["path",{d:"M11 20h10",key:"jvxblo"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ko=l("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xo=l("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zo=l("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yo=l("Bitcoin",[["path",{d:"M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727",key:"yr8idg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qo=l("Blocks",[["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["path",{d:"M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3",key:"1fpvtg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jo=l("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=l("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=l("ChartLine",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=l("CheckCheck",[["path",{d:"M18 6 7 17l-5-5",key:"116fxf"}],["path",{d:"m22 10-7.5 7.5L13 16",key:"ke71qq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=l("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=l("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=l("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=l("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=l("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=l("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=l("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=l("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=l("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=l("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=l("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=l("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=l("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=l("Crown",[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=l("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=l("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=l("Dot",[["circle",{cx:"12.1",cy:"12.1",r:"1",key:"18d7e5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=l("EllipsisVertical",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=l("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=l("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=l("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=l("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=l("FileQuestion",[["path",{d:"M12 17h.01",key:"p32p05"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}],["path",{d:"M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3",key:"mhlwft"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=l("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=l("Fingerprint",[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=l("Flag",[["path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",key:"i9b6wo"}],["line",{x1:"4",x2:"4",y1:"22",y2:"15",key:"1cm3nv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=l("Github",[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=l("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=l("Grid2x2",[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 12h18",key:"1i2n21"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=l("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=l("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=l("Hourglass",[["path",{d:"M5 22h14",key:"ehvnwv"}],["path",{d:"M5 2h14",key:"pdyrp9"}],["path",{d:"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22",key:"1d314k"}],["path",{d:"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",key:"1vvvr6"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=l("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=l("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=l("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=l("KeyRound",[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=l("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=l("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=l("ListOrdered",[["path",{d:"M10 12h11",key:"6m4ad9"}],["path",{d:"M10 18h11",key:"11hvi2"}],["path",{d:"M10 6h11",key:"c7qv1k"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=l("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=l("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=l("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=l("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=l("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=l("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=l("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=l("MessageSquarePlus",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["path",{d:"M12 7v6",key:"lw1j43"}],["path",{d:"M9 10h6",key:"9gxzsh"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=l("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=l("Network",[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=l("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=l("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=l("QrCode",[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=l("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=l("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=l("Reply",[["polyline",{points:"9 17 4 12 9 7",key:"hvgpf2"}],["path",{d:"M20 18v-2a4 4 0 0 0-4-4H4",key:"5vmcpk"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=l("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=l("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=l("SendHorizontal",[["path",{d:"M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z",key:"117uat"}],["path",{d:"M6 12h16",key:"s4cdu5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=l("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=l("Server",[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=l("Settings2",[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=l("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=l("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=l("Share",[["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}],["polyline",{points:"16 6 12 2 8 6",key:"m901s6"}],["line",{x1:"12",x2:"12",y1:"2",y2:"15",key:"1p0rca"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=l("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=l("SmilePlus",[["path",{d:"M22 11v1a10 10 0 1 1-9-10",key:"ew0xw9"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}],["path",{d:"M16 5h6",key:"1vod17"}],["path",{d:"M19 2v6",key:"4bpg5p"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=l("Smile",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=l("Star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=l("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=l("Trash",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=l("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=l("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=l("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=l("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=l("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=l("UserX",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=l("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=l("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=l("Vote",[["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}],["path",{d:"M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z",key:"1ezoue"}],["path",{d:"M22 19H2",key:"nuriw5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=l("Wallet",[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rs=l("WifiOff",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=l("Wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=l("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=l("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);function pn(e,t=globalThis==null?void 0:globalThis.document){const r=U(e);c.useEffect(()=>{const n=o=>{o.key==="Escape"&&r(o)};return t.addEventListener("keydown",n,{capture:!0}),()=>t.removeEventListener("keydown",n,{capture:!0})},[r,t])}var hn="DismissableLayer",je="dismissableLayer.update",yn="dismissableLayer.pointerDownOutside",mn="dismissableLayer.focusOutside",Xe,kt=c.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),wt=c.forwardRef((e,t)=>{const{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:n,onPointerDownOutside:o,onFocusOutside:a,onInteractOutside:i,onDismiss:s,...f}=e,d=c.useContext(kt),[p,h]=c.useState(null),m=(p==null?void 0:p.ownerDocument)??(globalThis==null?void 0:globalThis.document),[,b]=c.useState({}),k=q(t,E=>h(E)),u=Array.from(d.layers),[y]=[...d.layersWithOutsidePointerEventsDisabled].slice(-1),v=u.indexOf(y),w=p?u.indexOf(p):-1,C=d.layersWithOutsidePointerEventsDisabled.size>0,M=w>=v,S=bn(E=>{const P=E.target,j=[...d.branches].some(B=>B.contains(P));!M||j||(o==null||o(E),i==null||i(E),E.defaultPrevented||s==null||s())},m),R=xn(E=>{const P=E.target;[...d.branches].some(B=>B.contains(P))||(a==null||a(E),i==null||i(E),E.defaultPrevented||s==null||s())},m);return pn(E=>{w===d.layers.size-1&&(n==null||n(E),!E.defaultPrevented&&s&&(E.preventDefault(),s()))},m),c.useEffect(()=>{if(p)return r&&(d.layersWithOutsidePointerEventsDisabled.size===0&&(Xe=m.body.style.pointerEvents,m.body.style.pointerEvents="none"),d.layersWithOutsidePointerEventsDisabled.add(p)),d.layers.add(p),Ze(),()=>{r&&d.layersWithOutsidePointerEventsDisabled.size===1&&(m.body.style.pointerEvents=Xe)}},[p,m,r,d]),c.useEffect(()=>()=>{p&&(d.layers.delete(p),d.layersWithOutsidePointerEventsDisabled.delete(p),Ze())},[p,d]),c.useEffect(()=>{const E=()=>b({});return document.addEventListener(je,E),()=>document.removeEventListener(je,E)},[]),g.jsx(_.div,{...f,ref:k,style:{pointerEvents:C?M?"auto":"none":void 0,...e.style},onFocusCapture:V(e.onFocusCapture,R.onFocusCapture),onBlurCapture:V(e.onBlurCapture,R.onBlurCapture),onPointerDownCapture:V(e.onPointerDownCapture,S.onPointerDownCapture)})});wt.displayName=hn;var gn="DismissableLayerBranch",vn=c.forwardRef((e,t)=>{const r=c.useContext(kt),n=c.useRef(null),o=q(t,n);return c.useEffect(()=>{const a=n.current;if(a)return r.branches.add(a),()=>{r.branches.delete(a)}},[r.branches]),g.jsx(_.div,{...e,ref:o})});vn.displayName=gn;function bn(e,t=globalThis==null?void 0:globalThis.document){const r=U(e),n=c.useRef(!1),o=c.useRef(()=>{});return c.useEffect(()=>{const a=s=>{if(s.target&&!n.current){let f=function(){Mt(yn,r,d,{discrete:!0})};const d={originalEvent:s};s.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=f,t.addEventListener("click",o.current,{once:!0})):f()}else t.removeEventListener("click",o.current);n.current=!1},i=window.setTimeout(()=>{t.addEventListener("pointerdown",a)},0);return()=>{window.clearTimeout(i),t.removeEventListener("pointerdown",a),t.removeEventListener("click",o.current)}},[t,r]),{onPointerDownCapture:()=>n.current=!0}}function xn(e,t=globalThis==null?void 0:globalThis.document){const r=U(e),n=c.useRef(!1);return c.useEffect(()=>{const o=a=>{a.target&&!n.current&&Mt(mn,r,{originalEvent:a},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,r]),{onFocusCapture:()=>n.current=!0,onBlurCapture:()=>n.current=!1}}function Ze(){const e=new CustomEvent(je);document.dispatchEvent(e)}function Mt(e,t,r,{discrete:n}){const o=r.originalEvent.target,a=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:r});t&&o.addEventListener(e,t,{once:!0}),n?Mr(o,a):o.dispatchEvent(a)}var Ce="focusScope.autoFocusOnMount",Ee="focusScope.autoFocusOnUnmount",Ye={bubbles:!1,cancelable:!0},kn="FocusScope",Ct=c.forwardRef((e,t)=>{const{loop:r=!1,trapped:n=!1,onMountAutoFocus:o,onUnmountAutoFocus:a,...i}=e,[s,f]=c.useState(null),d=U(o),p=U(a),h=c.useRef(null),m=q(t,u=>f(u)),b=c.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;c.useEffect(()=>{if(n){let u=function(C){if(b.paused||!s)return;const M=C.target;s.contains(M)?h.current=M:W(h.current,{select:!0})},y=function(C){if(b.paused||!s)return;const M=C.relatedTarget;M!==null&&(s.contains(M)||W(h.current,{select:!0}))},v=function(C){if(document.activeElement===document.body)for(const S of C)S.removedNodes.length>0&&W(s)};document.addEventListener("focusin",u),document.addEventListener("focusout",y);const w=new MutationObserver(v);return s&&w.observe(s,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",u),document.removeEventListener("focusout",y),w.disconnect()}}},[n,s,b.paused]),c.useEffect(()=>{if(s){Je.add(b);const u=document.activeElement;if(!s.contains(u)){const v=new CustomEvent(Ce,Ye);s.addEventListener(Ce,d),s.dispatchEvent(v),v.defaultPrevented||(wn(Nn(Et(s)),{select:!0}),document.activeElement===u&&W(s))}return()=>{s.removeEventListener(Ce,d),setTimeout(()=>{const v=new CustomEvent(Ee,Ye);s.addEventListener(Ee,p),s.dispatchEvent(v),v.defaultPrevented||W(u??document.body,{select:!0}),s.removeEventListener(Ee,p),Je.remove(b)},0)}}},[s,d,p,b]);const k=c.useCallback(u=>{if(!r&&!n||b.paused)return;const y=u.key==="Tab"&&!u.altKey&&!u.ctrlKey&&!u.metaKey,v=document.activeElement;if(y&&v){const w=u.currentTarget,[C,M]=Mn(w);C&&M?!u.shiftKey&&v===M?(u.preventDefault(),r&&W(C,{select:!0})):u.shiftKey&&v===C&&(u.preventDefault(),r&&W(M,{select:!0})):v===w&&u.preventDefault()}},[r,n,b.paused]);return g.jsx(_.div,{tabIndex:-1,...i,ref:m,onKeyDown:k})});Ct.displayName=kn;function wn(e,{select:t=!1}={}){const r=document.activeElement;for(const n of e)if(W(n,{select:t}),document.activeElement!==r)return}function Mn(e){const t=Et(e),r=Qe(t,e),n=Qe(t.reverse(),e);return[r,n]}function Et(e){const t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:n=>{const o=n.tagName==="INPUT"&&n.type==="hidden";return n.disabled||n.hidden||o?NodeFilter.FILTER_SKIP:n.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}function Qe(e,t){for(const r of e)if(!Cn(r,{upTo:t}))return r}function Cn(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function En(e){return e instanceof HTMLInputElement&&"select"in e}function W(e,{select:t=!1}={}){if(e&&e.focus){const r=document.activeElement;e.focus({preventScroll:!0}),e!==r&&En(e)&&t&&e.select()}}var Je=Sn();function Sn(){let e=[];return{add(t){const r=e[0];t!==r&&(r==null||r.pause()),e=et(e,t),e.unshift(t)},remove(t){var r;e=et(e,t),(r=e[0])==null||r.resume()}}}function et(e,t){const r=[...e],n=r.indexOf(t);return n!==-1&&r.splice(n,1),r}function Nn(e){return e.filter(t=>t.tagName!=="A")}var An="Portal",St=c.forwardRef((e,t)=>{var s;const{container:r,...n}=e,[o,a]=c.useState(!1);de(()=>a(!0),[]);const i=r||o&&((s=globalThis==null?void 0:globalThis.document)==null?void 0:s.body);return i?or.createPortal(g.jsx(_.div,{...n,ref:t}),i):null});St.displayName=An;var Se=0;function Rn(){c.useEffect(()=>{const e=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",e[0]??tt()),document.body.insertAdjacentElement("beforeend",e[1]??tt()),Se++,()=>{Se===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(t=>t.remove()),Se--}},[])}function tt(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}var ce="right-scroll-bar-position",le="width-before-scroll-bar",Pn="with-scroll-bars-hidden",On="--removed-body-scroll-bar-size";function Ne(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function Dn(e,t){var r=c.useState(function(){return{value:e,callback:t,facade:{get current(){return r.value},set current(n){var o=r.value;o!==n&&(r.value=n,r.callback(n,o))}}}})[0];return r.callback=t,r.facade}var Ln=typeof window<"u"?c.useLayoutEffect:c.useEffect,rt=new WeakMap;function jn(e,t){var r=Dn(null,function(n){return e.forEach(function(o){return Ne(o,n)})});return Ln(function(){var n=rt.get(r);if(n){var o=new Set(n),a=new Set(e),i=r.current;o.forEach(function(s){a.has(s)||Ne(s,null)}),a.forEach(function(s){o.has(s)||Ne(s,i)})}rt.set(r,e)},[e]),r}function Tn(e){return e}function zn(e,t){t===void 0&&(t=Tn);var r=[],n=!1,o={read:function(){if(n)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return r.length?r[r.length-1]:e},useMedium:function(a){var i=t(a,n);return r.push(i),function(){r=r.filter(function(s){return s!==i})}},assignSyncMedium:function(a){for(n=!0;r.length;){var i=r;r=[],i.forEach(a)}r={push:function(s){return a(s)},filter:function(){return r}}},assignMedium:function(a){n=!0;var i=[];if(r.length){var s=r;r=[],s.forEach(a),i=r}var f=function(){var p=i;i=[],p.forEach(a)},d=function(){return Promise.resolve().then(f)};d(),r={push:function(p){i.push(p),d()},filter:function(p){return i=i.filter(p),r}}}};return o}function _n(e){e===void 0&&(e={});var t=zn(null);return t.options=L({async:!0,ssr:!1},e),t}var Nt=function(e){var t=e.sideCar,r=lt(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var n=t.read();if(!n)throw new Error("Sidecar medium not found");return c.createElement(n,L({},r))};Nt.isSideCarExport=!0;function In(e,t){return e.useMedium(t),Nt}var At=_n(),Ae=function(){},ye=c.forwardRef(function(e,t){var r=c.useRef(null),n=c.useState({onScrollCapture:Ae,onWheelCapture:Ae,onTouchMoveCapture:Ae}),o=n[0],a=n[1],i=e.forwardProps,s=e.children,f=e.className,d=e.removeScrollBar,p=e.enabled,h=e.shards,m=e.sideCar,b=e.noIsolation,k=e.inert,u=e.allowPinchZoom,y=e.as,v=y===void 0?"div":y,w=e.gapMode,C=lt(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as","gapMode"]),M=m,S=jn([r,t]),R=L(L({},C),o);return c.createElement(c.Fragment,null,p&&c.createElement(M,{sideCar:At,removeScrollBar:d,shards:h,noIsolation:b,inert:k,setCallbacks:a,allowPinchZoom:!!u,lockRef:r,gapMode:w}),i?c.cloneElement(c.Children.only(s),L(L({},R),{ref:S})):c.createElement(v,L({},R,{className:f,ref:S}),s))});ye.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};ye.classNames={fullWidth:le,zeroRight:ce};var Fn=function(){if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function Wn(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=Fn();return t&&e.setAttribute("nonce",t),e}function Vn(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function Bn(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var Un=function(){var e=0,t=null;return{add:function(r){e==0&&(t=Wn())&&(Vn(t,r),Bn(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Hn=function(){var e=Un();return function(t,r){c.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&r])}},Rt=function(){var e=Hn(),t=function(r){var n=r.styles,o=r.dynamic;return e(n,o),null};return t},qn={left:0,top:0,right:0,gap:0},Re=function(e){return parseInt(e||"",10)||0},Gn=function(e){var t=window.getComputedStyle(document.body),r=t[e==="padding"?"paddingLeft":"marginLeft"],n=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[Re(r),Re(n),Re(o)]},$n=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return qn;var t=Gn(e),r=document.documentElement.clientWidth,n=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,n-r+t[2]-t[0])}},Kn=Rt(),Z="data-scroll-locked",Xn=function(e,t,r,n){var o=e.left,a=e.top,i=e.right,s=e.gap;return r===void 0&&(r="margin"),`
  .`.concat(Pn,` {
   overflow: hidden `).concat(n,`;
   padding-right: `).concat(s,"px ").concat(n,`;
  }
  body[`).concat(Z,`] {
    overflow: hidden `).concat(n,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(n,";"),r==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(a,`px;
    padding-right: `).concat(i,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s,"px ").concat(n,`;
    `),r==="padding"&&"padding-right: ".concat(s,"px ").concat(n,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(ce,` {
    right: `).concat(s,"px ").concat(n,`;
  }
  
  .`).concat(le,` {
    margin-right: `).concat(s,"px ").concat(n,`;
  }
  
  .`).concat(ce," .").concat(ce,` {
    right: 0 `).concat(n,`;
  }
  
  .`).concat(le," .").concat(le,` {
    margin-right: 0 `).concat(n,`;
  }
  
  body[`).concat(Z,`] {
    `).concat(On,": ").concat(s,`px;
  }
`)},nt=function(){var e=parseInt(document.body.getAttribute(Z)||"0",10);return isFinite(e)?e:0},Zn=function(){c.useEffect(function(){return document.body.setAttribute(Z,(nt()+1).toString()),function(){var e=nt()-1;e<=0?document.body.removeAttribute(Z):document.body.setAttribute(Z,e.toString())}},[])},Yn=function(e){var t=e.noRelative,r=e.noImportant,n=e.gapMode,o=n===void 0?"margin":n;Zn();var a=c.useMemo(function(){return $n(o)},[o]);return c.createElement(Kn,{styles:Xn(a,!t,o,r?"":"!important")})},Te=!1;if(typeof window<"u")try{var oe=Object.defineProperty({},"passive",{get:function(){return Te=!0,!0}});window.addEventListener("test",oe,oe),window.removeEventListener("test",oe,oe)}catch{Te=!1}var G=Te?{passive:!1}:!1,Qn=function(e){return e.tagName==="TEXTAREA"},Pt=function(e,t){if(!(e instanceof Element))return!1;var r=window.getComputedStyle(e);return r[t]!=="hidden"&&!(r.overflowY===r.overflowX&&!Qn(e)&&r[t]==="visible")},Jn=function(e){return Pt(e,"overflowY")},eo=function(e){return Pt(e,"overflowX")},ot=function(e,t){var r=t.ownerDocument,n=t;do{typeof ShadowRoot<"u"&&n instanceof ShadowRoot&&(n=n.host);var o=Ot(e,n);if(o){var a=Dt(e,n),i=a[1],s=a[2];if(i>s)return!0}n=n.parentNode}while(n&&n!==r.body);return!1},to=function(e){var t=e.scrollTop,r=e.scrollHeight,n=e.clientHeight;return[t,r,n]},ro=function(e){var t=e.scrollLeft,r=e.scrollWidth,n=e.clientWidth;return[t,r,n]},Ot=function(e,t){return e==="v"?Jn(t):eo(t)},Dt=function(e,t){return e==="v"?to(t):ro(t)},no=function(e,t){return e==="h"&&t==="rtl"?-1:1},oo=function(e,t,r,n,o){var a=no(e,window.getComputedStyle(t).direction),i=a*n,s=r.target,f=t.contains(s),d=!1,p=i>0,h=0,m=0;do{var b=Dt(e,s),k=b[0],u=b[1],y=b[2],v=u-y-a*k;(k||v)&&Ot(e,s)&&(h+=v,m+=k),s instanceof ShadowRoot?s=s.host:s=s.parentNode}while(!f&&s!==document.body||f&&(t.contains(s)||t===s));return(p&&(Math.abs(h)<1||!o)||!p&&(Math.abs(m)<1||!o))&&(d=!0),d},ae=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},at=function(e){return[e.deltaX,e.deltaY]},st=function(e){return e&&"current"in e?e.current:e},ao=function(e,t){return e[0]===t[0]&&e[1]===t[1]},so=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},io=0,$=[];function co(e){var t=c.useRef([]),r=c.useRef([0,0]),n=c.useRef(),o=c.useState(io++)[0],a=c.useState(Rt)[0],i=c.useRef(e);c.useEffect(function(){i.current=e},[e]),c.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var u=ur([e.lockRef.current],(e.shards||[]).map(st),!0).filter(Boolean);return u.forEach(function(y){return y.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),u.forEach(function(y){return y.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var s=c.useCallback(function(u,y){if("touches"in u&&u.touches.length===2||u.type==="wheel"&&u.ctrlKey)return!i.current.allowPinchZoom;var v=ae(u),w=r.current,C="deltaX"in u?u.deltaX:w[0]-v[0],M="deltaY"in u?u.deltaY:w[1]-v[1],S,R=u.target,E=Math.abs(C)>Math.abs(M)?"h":"v";if("touches"in u&&E==="h"&&R.type==="range")return!1;var P=ot(E,R);if(!P)return!0;if(P?S=E:(S=E==="v"?"h":"v",P=ot(E,R)),!P)return!1;if(!n.current&&"changedTouches"in u&&(C||M)&&(n.current=S),!S)return!0;var j=n.current||S;return oo(j,y,u,j==="h"?C:M,!0)},[]),f=c.useCallback(function(u){var y=u;if(!(!$.length||$[$.length-1]!==a)){var v="deltaY"in y?at(y):ae(y),w=t.current.filter(function(S){return S.name===y.type&&(S.target===y.target||y.target===S.shadowParent)&&ao(S.delta,v)})[0];if(w&&w.should){y.cancelable&&y.preventDefault();return}if(!w){var C=(i.current.shards||[]).map(st).filter(Boolean).filter(function(S){return S.contains(y.target)}),M=C.length>0?s(y,C[0]):!i.current.noIsolation;M&&y.cancelable&&y.preventDefault()}}},[]),d=c.useCallback(function(u,y,v,w){var C={name:u,delta:y,target:v,should:w,shadowParent:lo(v)};t.current.push(C),setTimeout(function(){t.current=t.current.filter(function(M){return M!==C})},1)},[]),p=c.useCallback(function(u){r.current=ae(u),n.current=void 0},[]),h=c.useCallback(function(u){d(u.type,at(u),u.target,s(u,e.lockRef.current))},[]),m=c.useCallback(function(u){d(u.type,ae(u),u.target,s(u,e.lockRef.current))},[]);c.useEffect(function(){return $.push(a),e.setCallbacks({onScrollCapture:h,onWheelCapture:h,onTouchMoveCapture:m}),document.addEventListener("wheel",f,G),document.addEventListener("touchmove",f,G),document.addEventListener("touchstart",p,G),function(){$=$.filter(function(u){return u!==a}),document.removeEventListener("wheel",f,G),document.removeEventListener("touchmove",f,G),document.removeEventListener("touchstart",p,G)}},[]);var b=e.removeScrollBar,k=e.inert;return c.createElement(c.Fragment,null,k?c.createElement(a,{styles:so(o)}):null,b?c.createElement(Yn,{gapMode:e.gapMode}):null)}function lo(e){for(var t=null;e!==null;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}const uo=In(At,co);var Lt=c.forwardRef(function(e,t){return c.createElement(ye,L({},e,{ref:t,sideCar:uo}))});Lt.classNames=ye.classNames;var fo=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},K=new WeakMap,se=new WeakMap,ie={},Pe=0,jt=function(e){return e&&(e.host||jt(e.parentNode))},po=function(e,t){return t.map(function(r){if(e.contains(r))return r;var n=jt(r);return n&&e.contains(n)?n:(console.error("aria-hidden",r,"in not contained inside",e,". Doing nothing"),null)}).filter(function(r){return!!r})},ho=function(e,t,r,n){var o=po(t,Array.isArray(e)?e:[e]);ie[r]||(ie[r]=new WeakMap);var a=ie[r],i=[],s=new Set,f=new Set(o),d=function(h){!h||s.has(h)||(s.add(h),d(h.parentNode))};o.forEach(d);var p=function(h){!h||f.has(h)||Array.prototype.forEach.call(h.children,function(m){if(s.has(m))p(m);else try{var b=m.getAttribute(n),k=b!==null&&b!=="false",u=(K.get(m)||0)+1,y=(a.get(m)||0)+1;K.set(m,u),a.set(m,y),i.push(m),u===1&&k&&se.set(m,!0),y===1&&m.setAttribute(r,"true"),k||m.setAttribute(n,"true")}catch(v){console.error("aria-hidden: cannot operate on ",m,v)}})};return p(t),s.clear(),Pe++,function(){i.forEach(function(h){var m=K.get(h)-1,b=a.get(h)-1;K.set(h,m),a.set(h,b),m||(se.has(h)||h.removeAttribute(n),se.delete(h)),b||h.removeAttribute(r)}),Pe--,Pe||(K=new WeakMap,K=new WeakMap,se=new WeakMap,ie={})}},yo=function(e,t,r){r===void 0&&(r="data-aria-hidden");var n=Array.from(Array.isArray(e)?e:[e]),o=fo(e);return o?(n.push.apply(n,Array.from(o.querySelectorAll("[aria-live]"))),ho(n,o,r,"aria-hidden")):function(){return null}},_e="Dialog",[Tt,Ds]=pr(_e),[mo,D]=Tt(_e),zt=e=>{const{__scopeDialog:t,children:r,open:n,defaultOpen:o,onOpenChange:a,modal:i=!0}=e,s=c.useRef(null),f=c.useRef(null),[d=!1,p]=Cr({prop:n,defaultProp:o,onChange:a});return g.jsx(mo,{scope:t,triggerRef:s,contentRef:f,contentId:we(),titleId:we(),descriptionId:we(),open:d,onOpenChange:p,onOpenToggle:c.useCallback(()=>p(h=>!h),[p]),modal:i,children:r})};zt.displayName=_e;var _t="DialogTrigger",It=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,o=D(_t,r),a=q(t,o.triggerRef);return g.jsx(_.button,{type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":We(o.open),...n,ref:a,onClick:V(e.onClick,o.onOpenToggle)})});It.displayName=_t;var Ie="DialogPortal",[go,Ft]=Tt(Ie,{forceMount:void 0}),Wt=e=>{const{__scopeDialog:t,forceMount:r,children:n,container:o}=e,a=D(Ie,t);return g.jsx(go,{scope:t,forceMount:r,children:c.Children.map(n,i=>g.jsx(he,{present:r||a.open,children:g.jsx(St,{asChild:!0,container:o,children:i})}))})};Wt.displayName=Ie;var ue="DialogOverlay",Vt=c.forwardRef((e,t)=>{const r=Ft(ue,e.__scopeDialog),{forceMount:n=r.forceMount,...o}=e,a=D(ue,e.__scopeDialog);return a.modal?g.jsx(he,{present:n||a.open,children:g.jsx(vo,{...o,ref:t})}):null});Vt.displayName=ue;var vo=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,o=D(ue,r);return g.jsx(Lt,{as:pe,allowPinchZoom:!0,shards:[o.contentRef],children:g.jsx(_.div,{"data-state":We(o.open),...n,ref:t,style:{pointerEvents:"auto",...n.style}})})}),H="DialogContent",Bt=c.forwardRef((e,t)=>{const r=Ft(H,e.__scopeDialog),{forceMount:n=r.forceMount,...o}=e,a=D(H,e.__scopeDialog);return g.jsx(he,{present:n||a.open,children:a.modal?g.jsx(bo,{...o,ref:t}):g.jsx(xo,{...o,ref:t})})});Bt.displayName=H;var bo=c.forwardRef((e,t)=>{const r=D(H,e.__scopeDialog),n=c.useRef(null),o=q(t,r.contentRef,n);return c.useEffect(()=>{const a=n.current;if(a)return yo(a)},[]),g.jsx(Ut,{...e,ref:o,trapFocus:r.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:V(e.onCloseAutoFocus,a=>{var i;a.preventDefault(),(i=r.triggerRef.current)==null||i.focus()}),onPointerDownOutside:V(e.onPointerDownOutside,a=>{const i=a.detail.originalEvent,s=i.button===0&&i.ctrlKey===!0;(i.button===2||s)&&a.preventDefault()}),onFocusOutside:V(e.onFocusOutside,a=>a.preventDefault())})}),xo=c.forwardRef((e,t)=>{const r=D(H,e.__scopeDialog),n=c.useRef(!1),o=c.useRef(!1);return g.jsx(Ut,{...e,ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:a=>{var i,s;(i=e.onCloseAutoFocus)==null||i.call(e,a),a.defaultPrevented||(n.current||(s=r.triggerRef.current)==null||s.focus(),a.preventDefault()),n.current=!1,o.current=!1},onInteractOutside:a=>{var f,d;(f=e.onInteractOutside)==null||f.call(e,a),a.defaultPrevented||(n.current=!0,a.detail.originalEvent.type==="pointerdown"&&(o.current=!0));const i=a.target;((d=r.triggerRef.current)==null?void 0:d.contains(i))&&a.preventDefault(),a.detail.originalEvent.type==="focusin"&&o.current&&a.preventDefault()}})}),Ut=c.forwardRef((e,t)=>{const{__scopeDialog:r,trapFocus:n,onOpenAutoFocus:o,onCloseAutoFocus:a,...i}=e,s=D(H,r),f=c.useRef(null),d=q(t,f);return Rn(),g.jsxs(g.Fragment,{children:[g.jsx(Ct,{asChild:!0,loop:!0,trapped:n,onMountAutoFocus:o,onUnmountAutoFocus:a,children:g.jsx(wt,{role:"dialog",id:s.contentId,"aria-describedby":s.descriptionId,"aria-labelledby":s.titleId,"data-state":We(s.open),...i,ref:d,onDismiss:()=>s.onOpenChange(!1)})}),g.jsxs(g.Fragment,{children:[g.jsx(ko,{titleId:s.titleId}),g.jsx(Mo,{contentRef:f,descriptionId:s.descriptionId})]})]})}),Fe="DialogTitle",Ht=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,o=D(Fe,r);return g.jsx(_.h2,{id:o.titleId,...n,ref:t})});Ht.displayName=Fe;var qt="DialogDescription",Gt=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,o=D(qt,r);return g.jsx(_.p,{id:o.descriptionId,...n,ref:t})});Gt.displayName=qt;var $t="DialogClose",Kt=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,o=D($t,r);return g.jsx(_.button,{type:"button",...n,ref:t,onClick:V(e.onClick,()=>o.onOpenChange(!1))})});Kt.displayName=$t;function We(e){return e?"open":"closed"}var Xt="DialogTitleWarning",[Ls,Zt]=fr(Xt,{contentName:H,titleName:Fe,docsSlug:"dialog"}),ko=({titleId:e})=>{const t=Zt(Xt),r=`\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;return c.useEffect(()=>{e&&(document.getElementById(e)||console.error(r))},[r,e]),null},wo="DialogDescriptionWarning",Mo=({contentRef:e,descriptionId:t})=>{const n=`Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Zt(wo).contentName}}.`;return c.useEffect(()=>{var a;const o=(a=e.current)==null?void 0:a.getAttribute("aria-describedby");t&&o&&(document.getElementById(t)||console.warn(n))},[n,e,t]),null},Yt=zt,Co=It,Qt=Wt,me=Vt,ge=Bt,ve=Ht,be=Gt,Jt=Kt;const js=Yt,Ts=Co,Eo=Qt,er=c.forwardRef(({className:e,...t},r)=>g.jsx(me,{ref:r,className:O("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",e),...t}));er.displayName=me.displayName;const So=c.forwardRef(({className:e,children:t,...r},n)=>g.jsxs(Eo,{children:[g.jsx(er,{}),g.jsxs(ge,{ref:n,className:O("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",e),...r,children:[t,g.jsxs(Jt,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[g.jsx(xt,{className:"h-4 w-4"}),g.jsx("span",{className:"sr-only",children:"Close"})]})]})]}));So.displayName=ge.displayName;const No=({className:e,...t})=>g.jsx("div",{className:O("flex flex-col space-y-1.5 text-center sm:text-left",e),...t});No.displayName="DialogHeader";const Ao=({className:e,...t})=>g.jsx("div",{className:O("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",e),...t});Ao.displayName="DialogFooter";const Ro=c.forwardRef(({className:e,...t},r)=>g.jsx(ve,{ref:r,className:O("text-lg font-semibold leading-none tracking-tight",e),...t}));Ro.displayName=ve.displayName;const Po=c.forwardRef(({className:e,...t},r)=>g.jsx(be,{ref:r,className:O("text-sm text-muted-foreground",e),...t}));Po.displayName=be.displayName;const zs=Yt,Oo=Qt,tr=c.forwardRef(({className:e,...t},r)=>g.jsx(me,{className:O("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",e),...t,ref:r}));tr.displayName=me.displayName;const Do=vt("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",{variants:{side:{top:"inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",bottom:"inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",left:"inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",right:"inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"}},defaultVariants:{side:"right"}}),Lo=c.forwardRef(({side:e="right",className:t,children:r,...n},o)=>g.jsxs(Oo,{children:[g.jsx(tr,{}),g.jsxs(ge,{ref:o,className:O(Do({side:e}),t),...n,children:[r,g.jsxs(Jt,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",children:[g.jsx(xt,{className:"h-4 w-4"}),g.jsx("span",{className:"sr-only",children:"Close"})]})]})]}));Lo.displayName=ge.displayName;const jo=c.forwardRef(({className:e,...t},r)=>g.jsx(ve,{ref:r,className:O("text-lg font-semibold text-foreground",e),...t}));jo.displayName=ve.displayName;const To=c.forwardRef(({className:e,...t},r)=>g.jsx(be,{ref:r,className:O("text-sm text-muted-foreground",e),...t}));To.displayName=be.displayName;export{fs as $,hs as A,ln as B,fa as C,wt as D,ft as E,Ct as F,Ma as G,ca as H,_a as I,ts as J,Fo as K,Ua as L,Za as M,_o as N,lt as O,_ as P,ur as Q,Lt as R,ps as S,ks as T,Io as U,ka as V,Ps as W,rs as X,La as Y,Os as Z,L as _,la as a,va as a$,Ms as a0,js as a1,So as a2,No as a3,Ro as a4,Po as a5,xt as a6,Ja as a7,Ao as a8,gs as a9,be as aA,Jt as aB,Qt as aC,Yt as aD,cn as aE,Oa as aF,Ba as aG,Bo as aH,$o as aI,Ho as aJ,ea as aK,as as aL,As as aM,ra as aN,ua as aO,ga as aP,Wo as aQ,Uo as aR,Vo as aS,Ko as aT,Ts as aU,Ea as aV,ms as aW,Go as aX,Da as aY,Qo as aZ,cs as a_,Yo as aa,ls as ab,Es as ac,da as ad,ya as ae,Ya as af,qa as ag,Zo as ah,ja as ai,Ra as aj,wa as ak,Ka as al,ns as am,ia as an,Ca as ao,Ha as ap,os as aq,vs as ar,ha as as,Sa as at,Ds as au,Co as av,me as aw,Ls as ax,ge as ay,ve as az,pe as b,xs as b0,bs as b1,ta as b2,Fa as b3,ma as b4,Ss as b5,ba as b6,aa as b7,Va as b8,Pa as b9,In as bA,zs as bB,Lo as bC,Wa as bD,Cs as ba,Ga as bb,ws as bc,Xa as bd,is as be,xa as bf,Aa as bg,Xo as bh,qo as bi,Ns as bj,ds as bk,Qa as bl,Na as bm,Ia as bn,es as bo,za as bp,Ta as bq,$a as br,Jo as bs,us as bt,_n as bu,jn as bv,le as bw,ce as bx,Rt as by,Yn as bz,Cr as c,U as d,V as e,we as f,O as g,pr as h,de as i,g as j,he as k,yo as l,Rn as m,dt as n,Mr as o,St as p,sa as q,na as r,pa as s,mr as t,q as u,vt as v,oa as w,Rs as x,ys as y,ss as z};
