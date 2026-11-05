#!/usr/bin/env python3
"""Exact QA configuration, no publisher and no change to other branches."""
import argparse,json,pathlib,re,subprocess,os
BRANCH='qa/op-p0-b7-der-ast-r2-20261019'
BASE='1d7e215a0547532fff5bf1b5f7803d3584a73391'
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--git',action='store_true');a=p.parse_args();r=pathlib.Path(a.repo).resolve(strict=True)
v=json.loads((r/'vercel.json').read_text());assert v['git']=={'deploymentEnabled':{BRANCH:False}}
assert v['ignoreCommand']=='if [ "$VERCEL_GIT_COMMIT_REF" = "'+BRANCH+'" ]; then exit 0; else exit 1; fi'
app=json.loads((r/'package.json').read_text());assert app['private'] is True
assert app['dependencies']['expo']=='~55.0.31' and app['dependencies']['react-native']=='0.83.10'
publish=(r/'.github/workflows/npm-publish-github-packages.yml').read_text()
assert 'ORCHIDPAY_PACKAGE_PUBLICATION=NO_GO' in publish and '          exit 1' in publish
assert not re.search(r'npm\s+publish|packages:\s*write',publish)
w=(r/'.github/workflows/orchidpay-b7-r2-qa.yml').read_text()
assert 'pull_request_target' not in w and 'secrets.' not in w and 'continue-on-error' not in w
assert BRANCH in w and 'qa/op-p0-store-factual-convergence-20261016' in w
assert 'release-admission:' in w and 'release-admission.py' in w
scope=json.loads((r/'security/B7_REVIEW_SCOPE.json').read_text());assert scope['baseSha']==BASE and scope['releaseApproved'] is False
if a.git:
 head=subprocess.check_output(['git','-C',str(r),'rev-parse','HEAD']).decode().strip()
 expected=os.environ.get('EXPECTED_SHA');assert expected and head==expected
 subprocess.run(['git','-C',str(r),'merge-base','--is-ancestor',BASE,head],check=True)
 actual=subprocess.check_output(['git','-C',str(r),'diff','--name-only',BASE,head]).decode().splitlines()
 assert sorted(actual)==sorted(scope['changedPaths']), 'DIFF_SCOPE_DRIFT'
 commits=subprocess.check_output(['git','-C',str(r),'rev-list',BASE+'..'+head]).decode().splitlines()
 assert len(commits)==3 and commits[1]=='bd6756b2a333fee78a3f4b8d358f44d2cf1bf31b' and commits[2]=='4ba09daf2c6de8be05e6822984475cda3705b4ae', 'Unexpected QA commit ancestry'
 assert subprocess.check_output(['git','-C',str(r),'rev-parse',commits[2]+'^']).decode().strip()==BASE, 'Original QA parent drift'
 assert subprocess.check_output(['git','-C',str(r),'rev-parse',commits[1]+'^']).decode().strip()==commits[2], 'CI hotfix parent drift'
 expected=['.github/workflows/orchidpay-b7-r2-qa.yml','scripts/security/b7/boundary-check.py']
 for parent,child in [(commits[2],commits[1]),(commits[1],head)]:
  changed=subprocess.check_output(['git','-C',str(r),'diff','--name-only',parent,child]).decode().splitlines()
  assert sorted(changed)==sorted(expected), 'Unexpected CI hotfix paths'
print('B7_QA_BOUNDARIES_PASS; RELEASE_AND_FINANCE_OFF')
