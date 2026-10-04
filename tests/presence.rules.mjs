import assert from 'node:assert/strict';
const project = process.env.GCLOUD_PROJECT || 'demo-gtt-presence';
const base = `http://${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8189'}/v1/projects/${project}/databases/(default)/documents`;
function token(uid) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({alg:'none',typ:'JWT'})}.${encode({sub:uid,user_id:uid,aud:project,iss:`https://securetoken.google.com/${project}`,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'custom'}})}.`;
}
async function call(uid, path, method='GET', data) {
  return fetch(`${base}${path}`, {method,headers:{'Content-Type':'application/json',...(uid ? {Authorization:`Bearer ${token(uid)}`} : {})},body:data?JSON.stringify(data):undefined});
}
const write = (uid,path,fields) => call(uid,path,'PATCH',{fields});
assert.equal((await write('alice','/friendPresence/alice',{enabled:{booleanValue:false}})).status,200);
assert.equal((await call(null,'/friendPresence/alice')).status,403);
assert.equal((await call('bob','/friendPresence/alice')).status,403);
assert.equal((await write('alice','/friendships/alice_bob',{participants:{arrayValue:{values:[{stringValue:'alice'},{stringValue:'bob'}]}},requester:{stringValue:'alice'},recipient:{stringValue:'bob'},status:{stringValue:'pending'}})).status,200);
assert.equal((await call('bob','/friendPresence/alice')).status,403);
assert.equal((await call('bob','/friendships/alice_bob?updateMask.fieldPaths=status','PATCH',{fields:{status:{stringValue:'accepted'}}})).status,200);
assert.equal((await call('bob','/friendPresence/alice')).status,200);
async function heartbeat(uid) {
 return call(uid,':commit','POST',{writes:[{update:{name:`projects/${project}/databases/(default)/documents/friendPresence/alice/sessions/tab1`,fields:{}},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]});
}
assert.equal((await heartbeat('alice')).status,403,'Cannot publish while hidden');
assert.equal((await write('alice','/friendPresence/alice',{enabled:{booleanValue:true}})).status,200);
assert.equal((await heartbeat('alice')).status,200,'Owner can publish server heartbeat');
assert.equal((await call('bob','/friendPresence/alice/sessions/tab1')).status,200);
assert.equal((await call('eve','/friendPresence/alice/sessions/tab1')).status,403);
assert.equal((await heartbeat('bob')).status,403,'Friends cannot publish on behalf of the owner');
assert.equal((await write('alice','/friendPresence/alice/sessions/tab1',{updatedAt:{timestampValue:'2099-01-01T00:00:00Z'}})).status,403,'No fake future heartbeat');
assert.equal((await write('alice','/friendPresence/alice',{enabled:{booleanValue:false}})).status,200);
assert.equal((await call('bob','/friendPresence/alice/sessions/tab1')).status,403,'Disabling hides existing sessions');
console.log('Presence rules: all privacy and ownership checks passed');
