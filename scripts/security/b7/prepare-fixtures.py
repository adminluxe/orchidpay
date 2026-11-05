#!/usr/bin/env python3
"""Acquire immutable PUBLIC controls; never install them in the application."""
import argparse,hashlib,json,pathlib,shutil,tarfile,urllib.request,urllib.parse
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--work',required=True)
a=p.parse_args();repo=pathlib.Path(a.repo).resolve(strict=True);work=pathlib.Path(a.work).resolve(strict=True)
assert repo!=work and repo not in work.parents, 'Work must be physically separate from repository'
inputs=json.loads((repo/'security/B7_TEST_INPUTS.json').read_text())
assert set(inputs)=={'original-braces','original-node-forge','b6-braces','b6-forge','forge1159'}
cache=work/'inputs';variants=work/'variants';ev=work/'evidence'
cache.mkdir();variants.mkdir();ev.mkdir(exist_ok=True)
records=[]
for name,meta in inputs.items():
 u=urllib.parse.urlsplit(meta['url']);assert u.scheme=='https' and u.hostname in ('registry.npmjs.org','raw.githubusercontent.com') and not u.username and not u.query
 assert 0<meta['size']<3000000
 req=urllib.request.Request(meta['url'],headers={'User-Agent':'OrchidPay-B7D-pinned-QA'})
 with urllib.request.urlopen(req,timeout=40) as response:
  assert response.status==200
  assert urllib.parse.urlsplit(response.url).hostname==u.hostname
  data=response.read(meta['size']+1)
 assert len(data)==meta['size'], 'Input size drift: '+name
 for alg in ('sha256','sha512'):assert hashlib.new(alg,data).hexdigest()==meta[alg], 'Input digest drift: '+name
 target=cache/name;target.write_bytes(data);records.append(dict(name=name,**meta))
 if name=='forge1159':continue
 dest=variants/name;dest.mkdir();seen=set();total=0
 with tarfile.open(target,'r:gz') as archive:
  for member in archive:
   rel=pathlib.PurePosixPath(member.name)
   assert rel.parts and rel.parts[0]=='package' and '..' not in rel.parts and not rel.is_absolute() and '\\' not in member.name
   assert member.isfile() or member.isdir(), 'Special archive entry'
   assert member.name not in seen, 'Duplicate archive entry';seen.add(member.name)
   target=dest.joinpath(*rel.parts[1:])
   if member.isdir():target.mkdir(parents=True,exist_ok=True);continue
   total+=member.size;assert member.size<10000000 and total<25000000
   target.parent.mkdir(parents=True,exist_ok=True)
   with archive.extractfile(member) as source:target.write_bytes(source.read())
for name,version in [('original-braces','3.0.3'),('original-node-forge','1.4.0'),('b6-braces','3.0.4-orchidpay.1'),('b6-forge','1.4.1-orchidpay.1')]:
 meta=json.loads((variants/name/'package.json').read_text());assert meta['version']==version
for name in ('forge1159','forge1160'):shutil.copytree(variants/'b6-forge',variants/name)
shutil.copyfile(cache/'forge1159',variants/'forge1159/lib/rsa.js')
rsa=repo/'node_modules/node-forge/lib/rsa.js'
assert hashlib.sha256(rsa.read_bytes()).hexdigest()=='f1c736cb0dcd2615e9e8225ab894cd4cab55a384f6f07df221da1436096f3761'
shutil.copyfile(rsa,variants/'forge1160/lib/rsa.js')
(ev/'fixtures.json').write_text(json.dumps({'status':'PASS_PINNED_PUBLIC_CONTROLS','inputs':records},indent=2)+'\n')
print('FIVE_PUBLIC_CONTROLS_SHA256_SHA512_PASS')
