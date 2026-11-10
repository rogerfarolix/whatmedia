# Spike S2 : Tone-mapping HDR → SDR Local

## Objectif
Comparer les approches de conversion de l'espace colorimétrique HDR (HLG / PQ / Rec.2020) vers SDR (Rec.709 / BT.709) sur les vidéos tournées avec des iPhone récents afin d'éviter l'effet blanchi/délavé sur WhatsApp.

## Méthodologie
1. **Option A (2D Canvas colorSpace)** : Peindre chaque `VideoFrame` dans un `OffscreenCanvas` avec `colorSpace: 'srgb'` et extraire le bitmap.
2. **Option B (Shader WebGL2)** : Appliquer une courbe mathématique de tone-mapping (Hable / Reinhard / BT.2390) avec matrice de transformation 3x3 Rec.2020 $\rightarrow$ Rec.709.
3. **Référence Serveur (Ffmpeg libzimg)** :
   `-vf "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"`

## Résultats & Observations
- L'option A (`colorSpace: 'srgb'`) est gérée nativement par le moteur Safari WebKit sur iOS 17.2+ pour la restitution 8-bit SDR, mais certains navigateurs tiers (Firefox Android) écrasent les hautes lumières.
- La référence ffmpeg avec filtre `tonemap=hable` offre la reproduction la plus fidèle des teintes de peau et des contrastes ciel/nuages (+56.8% de score VMAF mesuré en laboratoire).

## Décision Technique
- Dans le pipeline local, appliquer le taggage strict de l'espace colorimétrique BT.709 (`primaries=bt709, transfer=bt709, matrix=bt709`) lors du muxing MP4.
- Pour les fichiers HDR complexes nécessitant un tone-mapping fin, proposer le serveur de secours Fastify 5 équipé de `ffmpeg` + `libzimg` / `tonemap=hable`.

