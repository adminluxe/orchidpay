#!/usr/bin/env python3
"""B7-D HF1: retain native npm evidence; reject contradictory reports.
A threshold pass is neither a backport exception nor a release authorization.
"""
import argparse
import collections
import copy
import hashlib
import json
import pathlib
import subprocess
import sys

LEVELS = ('info', 'low', 'moderate', 'high', 'critical')


def strict_json(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate JSON key: ' + key)
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=unique,
                      parse_constant=lambda s: (_ for _ in ()).throw(ValueError(s)))


def assess(j, rc):
    if type(j) is not dict or 'error' in j or type(rc) is not int or rc not in (0, 1):
        return 'UNVERIFIED'
    if j.get('auditReportVersion') != 2:
        return 'UNVERIFIED'
    meta = j.get('metadata')
    if type(meta) is not dict or type(meta.get('vulnerabilities')) is not dict:
        return 'UNVERIFIED'
    counts = meta['vulnerabilities']
    keys = LEVELS + ('total',)
    if any(type(counts.get(k)) is not int or counts[k] < 0 for k in keys):
        return 'UNVERIFIED'
    findings = j.get('vulnerabilities')
    if type(findings) is not dict:
        return 'UNVERIFIED'
    actual = collections.Counter()
    for name, entry in findings.items():
        if (not isinstance(name, str) or not name or type(entry) is not dict
                or entry.get('name') != name or entry.get('severity') not in LEVELS
                or type(entry.get('via')) is not list):
            return 'UNVERIFIED'
        actual[entry['severity']] += 1
    if (counts['total'] != sum(counts[k] for k in LEVELS)
            or counts['total'] != len(findings)
            or any(counts[k] != actual[k] for k in LEVELS)):
        return 'UNVERIFIED'
    failed = counts['high'] > 0 or counts['critical'] > 0
    if rc != (1 if failed else 0):
        return 'UNVERIFIED'
    return 'NO_GO_HIGH_CRITICAL' if failed else 'THRESHOLD_ONLY_PASS_NOT_RELEASE'


def selftest():
    def report(**counts):
        c = {k: counts.get(k, 0) for k in LEVELS}
        findings = {}
        for severity, count in c.items():
            for i in range(count):
                name = severity + '-synthetic-' + str(i)
                findings[name] = {'name': name, 'severity': severity, 'via': []}
        c['total'] = sum(c.values())
        return {'auditReportVersion': 2, 'metadata': {'vulnerabilities': c},
                'vulnerabilities': findings}
    cases = [
        ('zero', report(), 0, 'THRESHOLD_ONLY_PASS_NOT_RELEASE'),
        ('high', report(high=21), 1, 'NO_GO_HIGH_CRITICAL'),
        ('critical', report(critical=1), 1, 'NO_GO_HIGH_CRITICAL'),
        ('moderate-only-at-high-threshold', report(moderate=2), 0, 'THRESHOLD_ONLY_PASS_NOT_RELEASE'),
        ('high-with-zero-exit', report(high=1), 0, 'UNVERIFIED'),
        ('zero-with-error-exit', report(), 1, 'UNVERIFIED'),
        ('timeout', report(), 124, 'UNVERIFIED'),
        ('missing', {}, 0, 'UNVERIFIED'),
        ('array', [], 0, 'UNVERIFIED'),
        ('empty-error-object', dict(report(), error={}), 0, 'UNVERIFIED'),
        ('bool-return-code', report(), False, 'UNVERIFIED'),
    ]
    mutations = [
        ('hidden-high', lambda j: j['vulnerabilities'].update(report(high=1)['vulnerabilities'])),
        ('missing-findings', lambda j: j['vulnerabilities'].clear()),
        ('false-total', lambda j: j['metadata']['vulnerabilities'].update(total=0)),
        ('negative-count', lambda j: j['metadata']['vulnerabilities'].update(high=-1)),
        ('bool-count', lambda j: j['metadata']['vulnerabilities'].update(high=True)),
        ('wrong-severity', lambda j: next(iter(j['vulnerabilities'].values())).update(severity='low')),
        ('missing-name', lambda j: next(iter(j['vulnerabilities'].values())).pop('name')),
        ('wrong-version', lambda j: j.update(auditReportVersion=1)),
        ('null-metadata', lambda j: j.update(metadata=None)),
    ]
    for name, change in mutations:
        j = report() if name == 'hidden-high' else report(high=1)
        change(j)
        cases.append((name, j, 0 if name == 'hidden-high' else 1, 'UNVERIFIED'))
    for name, j, rc, expected in cases:
        if assess(j, rc) != expected:
            raise AssertionError(name)
    for raw in ('{"x":1,"x":2}', '{"x":NaN}'):
        try:
            strict_json(raw)
        except ValueError:
            pass
        else:
            raise AssertionError('Invalid JSON accepted')
    return {'tests': len(cases) + 2,
            'status': 'PASS_SYNTHETIC_ADMISSION_TESTS_NOT_ACTUAL_AUDIT'}


def write_new(path, data):
    with path.open('xb') as f:
        f.write(data)


def collect(repo, work):
    work.mkdir(parents=True, exist_ok=True)
    result = {}
    for label, extra in [('full', []), ('prod', ['--omit=dev'])]:
        cmd = ['npm', 'audit', '--json', '--audit-level=high'] + extra
        try:
            r = subprocess.run(cmd, cwd=str(repo), stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, timeout=180)
            raw, stderr, rc = r.stdout, r.stderr, r.returncode
        except subprocess.TimeoutExpired as e:
            raw, stderr, rc = e.stdout or b'', e.stderr or b'', 124
        write_new(work / (label + '-native.json'), raw)
        write_new(work / (label + '-native.stderr'), stderr)
        write_new(work / (label + '-native.exit'), (str(rc) + '\n').encode())
        try:
            j = strict_json(raw)
        except (ValueError, UnicodeError):
            j = None
        state = assess(j, rc)
        roots = {}
        if type(j) is dict and type(j.get('vulnerabilities')) is dict:
            for name, v in j['vulnerabilities'].items():
                if type(v) is dict and type(v.get('via')) is list:
                    urls = [x.get('url') for x in v['via'] if type(x) is dict]
                    if urls:
                        roots[name] = urls
        counts = None
        if type(j) is dict and type(j.get('metadata')) is dict:
            counts = j['metadata'].get('vulnerabilities')
        result[label] = dict(state=state, counts=counts, nativeExit=rc,
                             sha256=hashlib.sha256(raw).hexdigest(),
                             sha512=hashlib.sha512(raw).hexdigest(), rootAdvisories=roots)
    write_new(work / 'NATIVE_AUDIT_SUMMARY.json',
              (json.dumps(result, indent=2) + '\n').encode())
    print(json.dumps(result, indent=2))
    if any(x['state'] == 'UNVERIFIED' for x in result.values()):
        return 2
    if any(x['state'] == 'NO_GO_HIGH_CRITICAL' for x in result.values()):
        print('ORCHIDPAY_RELEASE_ADMISSION=NO_GO_HIGH_CRITICAL; NO_EXEMPTION')
        return 1
    print('NPM_THRESHOLD_ONLY=PASS; EXACT_SIGNED_ARTEFACT_AND_HUMAN_APPROVAL_STILL_REQUIRED')
    return 0


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--self-test', action='store_true')
    p.add_argument('--repo')
    p.add_argument('--out')
    a = p.parse_args()
    if a.self_test:
        print(json.dumps(selftest()))
    else:
        if not a.repo or not a.out:
            p.error('--repo and --out required')
        sys.exit(collect(pathlib.Path(a.repo).resolve(strict=True), pathlib.Path(a.out).resolve()))
