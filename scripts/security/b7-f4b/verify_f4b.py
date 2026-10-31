#!/usr/bin/env python3
"""B7-F4B: fail-closed provenance + immutable ancestry checks. NOT release approval."""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tarfile

BASE = "c31f277f20a3b4e26716131be00cd8f0e6e905a8"
PARENT_PREFIX = "97f5bdef"
NEW = "qa/op-p0-b7-f4b-convergence-20261031"
OLD = "qa/op-p0-b7-der-ast-r2-20261019"
IGNORE = ('case "$VERCEL_GIT_COMMIT_REF" in '
          'qa/op-p0-b7-der-ast-r2-20261019|qa/op-p0-b7-f4b-convergence-20261031) '
          'exit 0 ;; *) exit 1 ;; esac')
BRACES = {
 "path":"vendor/orchidpay-security/braces-3.0.3-orchidpay-e2.1.tgz",
 "sha256":"8dd49cf2759cd6a034e9f8fb1d1cd73291479fe07e02f516690302f96e589061",
 "sha512":"b442c997b482f1bdaffcaebecc2d8ac65308a872b1fe7ba2e0db368255a557546ce5bc968302d486c52f892b810666cb3a5bb67a06642ca0a01577eb285b3b8a",
 "bytes":18233,
 "integrity":"sha512-tELJl7SC8b2v/K6+zC2KxlMIqHKx/nui4Ns2glWlV1Rs5byWgwLUhsUviSuBBmbLOlu2egZkLKCgFXfrKFs7ig==",
}
OFFICIAL = {
 "node-forge":("1.4.2","https://registry.npmjs.org/node-forge/-/node-forge-1.4.2.tgz",
 "sha512-rRtAR5XLJ8gCKd9du4qrKAsgCG1ObGP4gLeNJMa4vYSeq4bmBMOJk5IHkrviBV0q7uoAJlVd8HEQYQSVUb4FGQ=="),
 "zod":("4.6.7","https://registry.npmjs.org/zod/-/zod-4.6.7.tgz",
 "sha512-g8W2D2kU6a8untc053fX1uVBKzM7yqAxW/3zwk83+6RyF2+SKOuV+c0wBDhUwzV1PaGapmZH+rmcUzPf+3CGwg=="),
}
PROTECTED = [
 ".github/workflows/orchidpay-b7-r2-qa.yml",
 ".github/workflows/npm-publish-github-packages.yml",
 "scripts/security/b7/boundary-check.py",
 "scripts/security/b7/sandbox.sh",
 "scripts/security/verify-local-security-forks.cjs",
 "scripts/op-p0-qa-export-gate.cjs",
 "scripts/op-p0-qa-export-gate.test.cjs",
 "security/B7_REVIEW_SCOPE.json",
 "security/B7_PACKAGE_MANIFEST.json",
 "src/security/paymentPolicy.ts",
 "src/security/executionPermit.ts",
 "src/security/releaseReadinessGate.ts",
]
class NoGo(Exception): pass
def guard(ok,msg):
 if not ok: raise NoGo(msg)
def strict(raw):
 def pairs(ps):
  out={}
  for k,v in ps:
   guard(k not in out,"DUPLICATE_JSON_KEY")
   out[k]=v
  return out
 return json.loads(raw,object_pairs_hook=pairs,parse_constant=lambda x: (_ for _ in ()).throw(NoGo("INVALID_JSON_CONSTANT")))
def safe(root,rel,max_bytes=30_000_000):
 p=PurePosixPath(rel)
 guard(bool(p.parts) and not p.is_absolute() and ".." not in p.parts and "\\" not in rel,"UNSAFE_RELATIVE_PATH")
 q=root
 for part in p.parts:
  q=q/part
  guard(not q.is_symlink(),"SYMLINK:"+rel)
 guard(q.is_file() and q.stat().st_nlink==1,"UNSAFE_FILE:"+rel)
 guard(q.stat().st_size<=max_bytes,"OVERSIZE:"+rel)
 return q.read_bytes()
def git(root,*args):
 return subprocess.check_output(["git","-C",str(root),*args],text=True,timeout=30,stderr=subprocess.DEVNULL).strip()
def allow(p):
 if p in ("package.json","package-lock.json","vercel.json",".github/workflows/orchidpay-b7-f4b-qa.yml"): return True
 if p.startswith("scripts/security/b7/"): return p=="scripts/security/b7/sdk55-consumers.cjs"
 if p.startswith("scripts/security/") or p.startswith("security/"): return True
 if p.startswith("vendor/orchidpay-security/") or p.startswith("docs/ORCHIDPAY_B7_F4"): return True
 return False
def check_git(root,pins):
 parent=pins["f4a"]
 guard(re.fullmatch(r"97f5bdef[0-9a-f]{32}",parent)!=None,"F4A_FULL_SHA_NOT_PINNED")
 expected=os.environ.get("EXPECTED_SHA","")
 head=git(root,"rev-parse","HEAD")
 guard(re.fullmatch(r"[0-9a-f]{40}",expected)!=None and head==expected,"EXACT_HEAD_MISMATCH")
 guard(git(root,"rev-parse","HEAD^")==parent,"F4B_PARENT_NOT_F4A")
 subprocess.run(["git","-C",str(root),"merge-base","--is-ancestor",BASE,parent],check=True,timeout=30,
                stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 delta=git(root,"diff","--name-only",parent,head).splitlines()
 expected={"vercel.json", ".github/workflows/orchidpay-b7-f4b-qa.yml",
           "scripts/security/b7-f4b/verify_f4b.py",
           "scripts/security/b7-f4b/prepare-sandbox.sh",
           "scripts/security/b7-f4b/run-audits.sh",
           "scripts/security/b7-f4b/run-mobile.sh",
           "scripts/security/b7-f4b/F4B_PINS.json",
           "docs/ORCHIDPAY_B7_F4B_DELTA.md"}
 guard(set(delta)==expected and len(delta)==len(expected),"F4B_DELTA_SCOPE_MISMATCH")
 guard(git(root,"diff","--name-only",BASE,head,"--",*PROTECTED)=="","B7_OR_FINANCE_FUSE_DRIFT")
 guard(git(root,"diff","--exit-code")=="" ,"TRACKED_SOURCE_MUTATED")
 return {"state":"PASS_GIT_SCOPE_ONLY","head":head,"F4A":parent,"delta":delta}
def check_lock(pkg,lock):
 guard(type(pkg)==dict and pkg.get("name")=="orchidpay" and pkg.get("private") is True,"NON_PRIVATE")
 d=pkg.get("dependencies",{}); o=pkg.get("overrides",{})
 guard(d.get("expo")=="~55.0.31" and d.get("react-native")=="0.83.10","SDK55_DRIFT")
 guard(d.get("braces")=="file:"+BRACES["path"] and d.get("node-forge")=="1.4.2","F4A_DEPENDENCY_DRIFT")
 guard(o.get("braces")=="$braces" and o.get("node-forge")=="$node-forge" and o.get("zod")=="4.6.7","OVERRIDES_DRIFT")
 guard(lock.get("lockfileVersion")==3 and type(lock.get("packages"))==dict,"LOCKFILE_FORMAT")
 packages=lock["packages"]
 guard(packages.get("",{}).get("dependencies")==d,"LOCK_ROOT_MISMATCH")
 for name,version,resolved,integrity in [
  ("braces","3.0.3","file:"+BRACES["path"],BRACES["integrity"]),
  *((n,*x) for n,x in OFFICIAL.items()),
 ]:
  key="node_modules/"+name
  found=[p for p in packages if p==key or p.endswith("/"+key)]
  guard(found==[key],"DUPLICATE_OR_MISSING:"+name)
  p=packages[key]
  guard(p.get("version")==version and p.get("resolved")==resolved and p.get("integrity")==integrity
        and p.get("link") is not True,"LOCK_IDENTITY_DRIFT:"+name)
 return True
def check_content(root):
 pkg=strict(safe(root,"package.json")); lock=strict(safe(root,"package-lock.json"))
 check_lock(pkg,lock)
 raw=safe(root,BRACES["path"],200_000)
 guard(len(raw)==BRACES["bytes"] and hashlib.sha256(raw).hexdigest()==BRACES["sha256"]
       and hashlib.sha512(raw).hexdigest()==BRACES["sha512"],"BRACES_ARCHIVE_HASH")
 guard("sha512-"+base64.b64encode(hashlib.sha512(raw).digest()).decode()==BRACES["integrity"],"BRACES_SRI")
 files={}
 with tarfile.open(fileobj=io.BytesIO(raw),mode="r:gz") as tf:
  for m in tf.getmembers():
   p=PurePosixPath(m.name)
   guard(len(p.parts)>=2 and p.parts[0]=="package" and ".." not in p.parts and m.isfile()
         and not m.issym() and not m.islnk() and m.size<200_000,"BRACES_TAR_MEMBER")
   name="/".join(p.parts[1:])
   guard(name not in files,"BRACES_TAR_DUPLICATE")
   files[name]=tf.extractfile(m).read()
 guard(len(files)==14 and all(x in files for x in ("LICENSE","SECURITY_BACKPORT.md","SECURITY_E2_BUDGETS.md","package.json")),"BRACES_PATCH_FILES")
 for name,version in (("braces","3.0.3"),("node-forge","1.4.2"),("zod","4.6.7")):
  meta=strict(safe(root,"node_modules/"+name+"/package.json",500_000))
  guard(meta.get("name")==name and meta.get("version")==version,"INSTALLED_VERSION:"+name)
  if name=="braces":
   prov=meta.get("orchidpayPatchProvenance")
   guard(meta.get("private") is True and type(prov)==dict and
         prov.get("releaseApproved") is False and
         prov.get("auditAdvisoriesIntentionallyRetained") is True,"BRACES_PRIVATE_PROVENANCE")
   actual=set()
   d=root/"node_modules"/"braces"
   for base,dirs,names in os.walk(d,followlinks=False):
    for n in dirs+names: guard(not (Path(base)/n).is_symlink(),"BRACES_INSTALLED_SYMLINK")
    actual.update((Path(base)/n).relative_to(d).as_posix() for n in names)
   guard(actual==set(files),"BRACES_INSTALLED_FILES_DRIFT")
   for rel,data in files.items():
    guard(safe(root,"node_modules/braces/"+rel,500_000)==data,"BRACES_INSTALLED_CONTENT")
  else:
   guard("orchidpayPatchProvenance" not in meta,"OFFICIAL_REPACKAGING:"+name)
 v=strict(safe(root,"vercel.json",100_000))
 switches=v.get("git",{}).get("deploymentEnabled",{})
 guard(type(switches)==dict and switches.get(OLD) is False and switches.get(NEW) is False,
       "VERCEL_QA_DEPLOYMENT_NOT_DISABLED")
 guard(v.get("ignoreCommand")==IGNORE,"VERCEL_IGNORE_COMMAND_DRIFT")
 return {"state":"PASS_LOCAL_CONTENT_ONLY","forge":"1.4.2 official registry",
         "zod":"4.6.7 official registry","bracesSHA256":BRACES["sha256"],
         "releaseApproved":False}
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--repo",required=True)
 p.add_argument("--phase",choices=("git","content"),required=True)
 a=p.parse_args()
 root=Path(a.repo)
 guard(root.is_absolute() and str(root)==os.path.normpath(str(root)),"NONCANONICAL_REPO")
 for q in (root,*root.parents): guard(not q.is_symlink(),"REPO_SYMLINK")
 pins=strict(safe(root,"scripts/security/b7-f4b/F4B_PINS.json",10_000))
 guard(pins.get("revision")=="B7-F4B-R1" and pins.get("base")==BASE and
       pins.get("branch")==NEW and pins.get("releaseApproved") is False,"PINS_POLICY")
 result=check_git(root,pins) if a.phase=="git" else check_content(root)
 print(json.dumps(result,indent=2,sort_keys=True))
if __name__=="__main__":
 try: main()
 except (NoGo,OSError,ValueError,TypeError,KeyError,subprocess.CalledProcessError,
         subprocess.TimeoutExpired,tarfile.TarError) as exc:
  print("B7_F4B_NO_GO:"+type(exc).__name__+":"+str(exc),file=sys.stderr)
  sys.exit(2)
