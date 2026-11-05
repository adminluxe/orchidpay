#!/usr/bin/env python3
"""OrchidPay 2.3.1(a) website source check, no network or Store operations."""
from __future__ import annotations
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"site"
PAGES=("index.html","support/index.html","privacy/index.html",
       "privacy-choices/index.html","legal/index.html","terms/index.html")

def ok(condition:bool,message:str)->None:
    if not condition: raise AssertionError(message)

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references=[]
        self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ("a","link","img"):
            href=a.get("href") or a.get("src")
            if href: self.references.append(href)
        if tag=="script": self.scripts.append(a.get("src") or "inline")

def check_reference(source:str,link:str)->None:
    if link.startswith(("mailto:","tel:","data:","#")):return
    parsed=urlparse(link)
    if parsed.scheme or link.startswith("//"):
        ok(parsed.scheme=="https" and
           parsed.hostname in ("www.orchidpay.online","orchidpay.online"),
           source+": forbidden external URL "+link)
        return
    path=link.split("?",1)[0].split("#",1)[0]
    target=(SITE/path.lstrip("/")) if path.startswith("/") else (SITE/source).parent/path
    if target.is_dir():target/="index.html"
    ok(target.is_file(),source+": local target missing "+link)

def check():
    meta=json.loads((ROOT/"docs/ORCHIDPAY_APPSTORE_COPY_B12_EN_FR_2026-10-12.json")
        .read_text(encoding="utf-8"))
    ok(meta.get("draftStatus")=="QA_ONLY_NOT_APPLIED_APP_STORE_CONNECT",
       "canonical metadata draft contract absent")
    ok(meta.get("appId")=="6808431270","unexpected ASC app id")
    for lang in ("en-US","fr-FR"):
        copy=meta["locales"][lang]
        ok("QR" in copy["description"],lang+" QR text missing")
        ok("payment" in copy["description"].lower() or
           "paiement" in copy["description"].lower(),
           lang+" no payment scope explanation")
    print("CANONICAL_APPSTORE_COPY_FR_EN=CONSISTENT")

    text={}
    for filename in PAGES:
        content=(SITE/filename).read_text(encoding="utf-8")
        ok(content.lstrip().lower().startswith("<!doctype html>"),
           filename+" invalid doctype")
        ok('href="/assets/styles.css"' in content,
           filename+" site styles missing")
        parser=Links();parser.feed(content)
        ok(not parser.scripts,filename+" scripts forbidden")
        for link in parser.references:check_reference(filename,link)
        text[filename]=content
        print("SITE_LINKS_"+filename.replace("/","_")+"=PASS")

    home=text["index.html"]
    support=text["support/index.html"]
    for old in ("Move money.","Préparer un transfert","Recevoir sans ambiguïté",
                "Demo balances and activity","Send/receive/deposit flows",
                "Private pilot · Live payments off","PAYMENT INFRASTRUCTURE"):
        ok(old.lower() not in (home+support).lower(),
           "legacy marketing detected "+old)
    for must in ("Votre appareil.","Lire un QR code","journal",
                 "ne fournit aucun compte bancaire",
                 "sans ouverture de lien"):
        ok(must.lower() in home.lower(),"missing factual marketing "+must)
    for anchor in ('id="product"','id="security"','id="status"','id="transparency"'):
        ok(anchor in home,"missing header link "+anchor)
    ok("contact@purpleorchidgroup.com" in support,"support contact missing")
    ok("does not validate recipients" in support,"support QR disclaimer missing")

    for name in ("terms/index.html","legal/index.html",
                 "privacy/index.html","privacy-choices/index.html"):
        page=text[name].lower()
        ok(("paiement" in page or "payment" in page),"exclusion missing "+name)
        ok(("qr" in page or name=="privacy-choices/index.html"),
           "product scope absent "+name)
    router=(ROOT/"src/AppShell.tsx").read_text(encoding="utf-8")
    for route in ("'home'","'scan'","'activity'","'profile'"):
        ok(route in router,"missing B12 route "+route)
    for forbidden in ("case 'send'","case 'receive'","case 'deposit'","case 'cards'"):
        ok(forbidden not in router,"payment route exposed "+forbidden)
    scan=(ROOT/"src/screens/ScanScreen.tsx").read_text(encoding="utf-8")
    ok("lastPayload" in scan and "Aucune action automatique" in scan,
       "read-only QR source mismatch")
    print("B12_SOURCE_NAVIGATION_QR_SCOPE=PASS")
    print("IOS_IPA_REAL_DEVICE_TEST=NOT_PERFORMED")
    print("APP_STORE_CONNECT_METADATA=NOT_APPLIED")
    print("PUBLIC_WEBSITE_DEPLOY=NOT_PERFORMED")
    print("FINAL_ORCHIDPAY_APPLE231_SITE_COPY=PASS_DRAFT_ONLY")

if __name__=="__main__":check()
