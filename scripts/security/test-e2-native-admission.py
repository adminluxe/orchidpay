#!/usr/bin/env python3
import importlib.util,pathlib,copy,json,sys
p=pathlib.Path(__file__).with_name('verify-e2-native-admission.py');s=importlib.util.spec_from_file_location('e2_admission',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def report(level=None):
    counts={k:0 for k in m.LEVELS+('total',)};v={}
    if level:
        counts[level]=1;counts['total']=1
        v['test-only']={'name':'test-only','severity':level,'via':['test-dependency'],'nodes':['node_modules/test-only']}
    return {'auditReportVersion':2,'metadata':{'vulnerabilities':counts},'vulnerabilities':v}
cases=[]
def add(name,r,rc,state):cases.append((name,json.dumps(r).encode(),rc,state))
add('zero-is-threshold-only',report(),0,'THRESHOLD_ONLY_PASS_NOT_RELEASE')
for k in m.LEVELS:add('level-'+k,report(k),1 if k in ('high','critical') else 0,'NO_GO_HIGH_CRITICAL' if k in ('high','critical') else 'THRESHOLD_ONLY_PASS_NOT_RELEASE')
for rc in [2,124,-9,True]:add('bad-exit-'+str(rc),report(),rc,'UNVERIFIED')
add('high-with-zero-exit',report('high'),0,'UNVERIFIED');add('empty-with-one-exit',report(),1,'UNVERIFIED')
r=report('high');r['metadata']['vulnerabilities']={k:0 for k in m.LEVELS+('total',)};add('false-zero-with-high-record',r,0,'UNVERIFIED')
r=report('critical');r['vulnerabilities']={};add('critical-count-without-record',r,1,'UNVERIFIED')
for value in [True,-1,1.0,'0']:
    r=report();r['metadata']['vulnerabilities']['high']=value;add('invalid-count-'+str(value),r,0,'UNVERIFIED')
r=report();del r['metadata']['vulnerabilities']['critical'];add('missing-critical-count',r,0,'UNVERIFIED')
r=report('high');r['vulnerabilities']['test-only']['severity']='moderate';add('severity-count-disagreement',r,1,'UNVERIFIED')
r=report('high');r['vulnerabilities']['test-only']['name']='other';add('name-disagreement',r,1,'UNVERIFIED')
r=report('high');r['vulnerabilities']['test-only']['via']=[];add('missing-via',r,1,'UNVERIFIED')
r=report('high');r['vulnerabilities']['test-only']['nodes']=[];add('missing-paths',r,1,'UNVERIFIED')
r=report();r['error']={'code':'ENETWORK'};add('network-error-is-not-clean',r,0,'UNVERIFIED')
r=report();r['auditReportVersion']=1;add('unexpected-format',r,0,'UNVERIFIED')
cases.extend([('truncated-json',b'{',0,'UNVERIFIED'),('duplicate-json-key',b'{"a":1,"a":2}',0,'UNVERIFIED'),('nonfinite-json',b'{"a":NaN}',0,'UNVERIFIED')])
results=[]
for name,raw,rc,wanted in cases:
    got=m.evaluate(raw,rc);results.append({'name':name,'pass':got['state']==wanted and got['releaseApproved'] is False,'state':got['state']})
print(json.dumps({'status':'PASS_SYNTHETIC_ADMISSION_ONLY' if all(x['pass'] for x in results) else 'FAIL','cases':len(results),'results':results,'actualAudit':False,'releaseApproved':False},indent=2))
sys.exit(0 if all(x['pass'] for x in results) else 2)
