#!/usr/bin/env python3
"""Strict native npm report consistency; no audit exception, no release authorization."""
import argparse,collections,hashlib,json,pathlib,re,sys
LEVELS=('info','low','moderate','high','critical')

def strict_json(raw):
    def object_pairs(pairs):
        out={}
        for k,v in pairs:
            if k in out:raise ValueError('DUPLICATE_JSON_KEY')
            out[k]=v
        return out
    return json.loads(raw,object_pairs_hook=object_pairs,parse_constant=lambda x: (_ for _ in ()).throw(ValueError('NONFINITE_JSON')))

def assess(report,native_exit):
    bad=lambda reason:{'state':'UNVERIFIED','reason':reason,'releaseApproved':False}
    if type(native_exit) is not int or native_exit not in (0,1):return bad('NATIVE_EXIT')
    if not isinstance(report,dict) or report.get('error') or report.get('auditReportVersion')!=2:return bad('REPORT_FORMAT')
    m=report.get('metadata');v=report.get('vulnerabilities')
    if not isinstance(m,dict) or not isinstance(v,dict):return bad('REPORT_STRUCTURE')
    c=m.get('vulnerabilities')
    if not isinstance(c,dict) or set(c)!=set(LEVELS+('total',)):return bad('COUNT_FIELDS')
    if any(type(c.get(k)) is not int or c[k]<0 for k in LEVELS+('total',)):return bad('INVALID_COUNT')
    actual=collections.Counter()
    for name,item in v.items():
        if not isinstance(name,str) or not isinstance(item,dict) or item.get('name')!=name or item.get('severity') not in LEVELS:return bad('VULNERABILITY_RECORD')
        if not isinstance(item.get('via'),list) or not item['via'] or not isinstance(item.get('nodes'),list) or not item['nodes'] or any(not isinstance(n,str) for n in item['nodes']):return bad('VULNERABILITY_PATHS')
        actual[item['severity']]+=1
    if c['total']!=len(v) or c['total']!=sum(c[k] for k in LEVELS) or any(c[k]!=actual[k] for k in LEVELS):return bad('COUNTS_DISAGREE_WITH_RECORDS')
    blocked=c['high']>0 or c['critical']>0
    if native_exit!=(1 if blocked else 0):return bad('EXIT_DISAGREES_WITH_HIGH_THRESHOLD')
    return {'state':'NO_GO_HIGH_CRITICAL' if blocked else 'THRESHOLD_ONLY_PASS_NOT_RELEASE','counts':c,'nativeExit':native_exit,'releaseApproved':False}

def evaluate(raw,native_exit):
    try:r=assess(strict_json(raw),native_exit)
    except (ValueError,TypeError,UnicodeError):r={'state':'UNVERIFIED','reason':'INVALID_JSON','releaseApproved':False}
    r.update(sha256=hashlib.sha256(raw).hexdigest(),sha512=hashlib.sha512(raw).hexdigest())
    return r

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--report',required=True);p.add_argument('--native-exit',required=True,type=int);a=p.parse_args()
    path=pathlib.Path(a.report)
    if not path.is_file() or path.is_symlink() or path.stat().st_size>10000000:raise SystemExit('NATIVE_REPORT_UNVERIFIED')
    result=evaluate(path.read_bytes(),a.native_exit);print(json.dumps(result,indent=2))
    sys.exit(0 if result['state']=='THRESHOLD_ONLY_PASS_NOT_RELEASE' else 1 if result['state']=='NO_GO_HIGH_CRITICAL' else 2)
