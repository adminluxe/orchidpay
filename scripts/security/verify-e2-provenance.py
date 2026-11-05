#!/usr/bin/env python3
"""Content checks only. Expected hashes must originate in a trusted exact-SHA policy."""
import argparse,hashlib,json,os,pathlib,re,sys

def verify(root,sha256,sha512):
    root=pathlib.Path(root)
    if not root.is_absolute() or root.resolve()!=root:raise ValueError('CANONICAL_ROOT_REQUIRED')
    for part in [root]+list(root.parents):
        if part.is_symlink():raise ValueError('ROOT_SYMLINK')
    if not re.fullmatch('[0-9a-f]{64}',sha256) or not re.fullmatch('[0-9a-f]{128}',sha512):raise ValueError('EXPECTED_HASH_REQUIRED')
    def read(rel):
        p=pathlib.PurePosixPath(rel)
        if p.is_absolute() or str(p)!=rel or '..' in p.parts or '\\' in rel:raise ValueError('UNSAFE_PATH')
        f=root
        for part in p.parts:
            f=f/part
            if f.is_symlink():raise ValueError('SYMLINK:'+rel)
        if not f.is_file() or f.stat().st_nlink!=1:raise ValueError('NOT_PRIVATE_REGULAR_FILE:'+rel)
        return f.read_bytes()
    def match(raw,h):
        if 'bytes' in h and len(raw)!=h['bytes']:raise ValueError('SIZE_DRIFT')
        for a in ('sha256','sha512'):
            if hashlib.new(a,raw).hexdigest()!=h[a]:raise ValueError(a.upper()+'_DRIFT')
    raw=read('security/E2_PACKAGE_MANIFEST.json');match(raw,dict(sha256=sha256,sha512=sha512));m=json.loads(raw)
    if m['revision']!='OP-B7-E2-BOUNDED-1' or m['releaseApproved'] is not False or m['officialUpstreamRelease'] is not False or m['auditAdvisoriesIntentionallyRetained'] is not True:raise ValueError('MANIFEST_POLICY')
    if set(m['packages'])!={'braces','node-forge'}:raise ValueError('PACKAGE_SET')
    pb=read('package.json');lb=read('package-lock.json');match(pb,m['packageJson']);match(lb,m['lock']);pkg=json.loads(pb);lock=json.loads(lb)
    if pkg['private'] is not True:raise ValueError('NOT_PRIVATE')
    rows=[]
    for name,entry in m['packages'].items():
        archive=read(entry['archive']);match(archive,entry)
        import base64
        sri='sha512-'+base64.b64encode(hashlib.sha512(archive).digest()).decode()
        if sri!=entry['integrity']:raise ValueError('ARCHIVE_SRI')
        spec='file:'+entry['archive'];location='node_modules/'+name
        if pkg['dependencies'][name]!=spec or pkg['overrides'][name]!='$'+name:raise ValueError('OVERRIDE_DRIFT')
        nodes=[p for p in lock['packages'] if p==location or p.endswith('/'+location)]
        if nodes!=[location]:raise ValueError('DUPLICATE_DEPENDENCY')
        node=lock['packages'][location]
        if node['version']!=entry['version'] or node['resolved']!=spec or node['integrity']!=sri:raise ValueError('LOCK_SRI_DRIFT')
        actual=[]
        for parent,dirs,files in os.walk(root/location,followlinks=False):
            for n in dirs+files:
                f=pathlib.Path(parent)/n
                if f.is_symlink():raise ValueError('PACKAGE_SYMLINK')
            for n in files:actual.append(str((pathlib.Path(parent)/n).relative_to(root/location)))
        if sorted(actual)!=sorted(entry['files']):raise ValueError('INSTALLED_FILE_SET')
        for rel,h in entry['files'].items():match(read(location+'/'+rel),h)
        installed=json.loads(read(location+'/package.json'))
        if installed['name']!=name or installed['version']!=entry['version'] or installed['private'] is not True:raise ValueError('INSTALLED_IDENTITY')
        provenance=installed['orchidpayPatchProvenance']
        if provenance['releaseApproved'] is not False or provenance['auditAdvisoriesIntentionallyRetained'] is not True:raise ValueError('INSTALLED_POLICY')
        rows.append({'name':name,'version':entry['version'],'files':len(actual)})
    return {'status':'PASS_EXACT_CONTENT_ONLY','packages':rows,'manifestSHA256':sha256,'manifestSHA512':sha512,'releaseApproved':False,'nativeAuditRequired':True,'trustedExpectedHashesRequired':True}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--sha256',required=True);p.add_argument('--sha512',required=True);a=p.parse_args()
    try:print(json.dumps(verify(a.root,a.sha256,a.sha512),indent=2))
    except Exception as e:print('E2_PROVENANCE_NO_GO '+type(e).__name__+': '+str(e),file=sys.stderr);sys.exit(2)
