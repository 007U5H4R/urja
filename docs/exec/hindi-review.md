# Hindi review (TKT-06)

Every Hindi string Urja shows, beside its English, for a native speaker to check (HANDOFF open item).

AI pre-review 2026-09-29 applied H1–H10; native review pending.

- **Generated** by `lib/brief/hindi-review.ts`; don't edit by hand. Regenerate with
  `UPDATE_HINDI_REVIEW=1 pnpm exec vitest run lib/brief/hindi-review.test.ts`.
- **How to review:** write OK, or a better wording, in the Reviewer column. Keep numbers, `₹`, `L` and plates as they are.
- **Wording rules:** say हिसाब नहीं मिल रहा (doesn't add up); never an accusation. Confidence words are पक्का / शायद / जाँचें.
- **Strings:** 312.

## 1. Morning brief (/brief), 27 Sep

lib/brief/template.ts `renderBrief`. `<b>` marks bold text.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | title | सुबह का हिसाब · Urja | Morning brief · Urja | |
| 2 | h1 (screen readers) | सुबह का हिसाब | Morning brief | |
| 3 | greeting | सुप्रभात, शर्मा जी | Good morning, Sharma ji | |
| 4 | date line | सोमवार, 28 सितंबर · कल की 17 ट्रिप का हिसाब | Monday, 28 September · yesterday’s 17 trips reconciled | |
| 5 | earned label | कल की कमाई | Earned yesterday | |
| 6 | chart span | पिछले 14 दिन | last 14 days | |
| 7 | 14-day chart aria-label | पिछले 14 दिन की कमाई, कल की कमाई सबसे ज़्यादा में से एक थी | Profit over the last 14 days; yesterday was one of the highest | |
| 8 | leak line (after the ₹) | का हिसाब नहीं मिल रहा · 3 ट्रिप में | doesn’t add up · across 3 trips | |
| 9 | items heading | इन 3 ट्रिप को देखें | Look at these 3 trips | |
| 10 | item 1 · RJ14 GB 4521 | बहरोड़ के पास खड़े ट्रक में 38 L डीज़ल का हिसाब नहीं — रात 2:14 बजे | 38 L diesel unaccounted while parked near Behror, 2:14 AM | |
| 11 | item 1 · confidence | पक्का | High | |
| 12 | item 1 · driver | रमेश से अभी नहीं पूछा | Ramesh not asked yet | |
| 13 | item 1 · link | सबूत | Evidence | |
| 14 | item 2 · RJ14 GA 1182 | किशनगढ़ में बिल 250 L का, पर टंकी में सिर्फ़ 200 L बढ़ा | Fuel bill says 250 L, but the tank rose only 200 L — Kishangarh | |
| 15 | item 2 · confidence | शायद | Likely | |
| 16 | item 2 · driver | विक्रम ने जवाब दिया | Vikram replied | |
| 17 | item 2 · link | देखें | Review | |
| 18 | item 3 · RJ14 GC 3309 | भिवंडी ट्रिप में आम से 39 L ज़्यादा डीज़ल लगा | Used 39 L more diesel than usual on the Bhiwandi run | |
| 19 | item 3 · confidence | जाँचें | Check | |
| 20 | item 3 · driver | अनिल से अभी नहीं पूछा | Anil not asked yet | |
| 21 | item 3 · link | सबूत | Evidence | |
| 22 | clean line | बाकी <b>14 ट्रिप</b> का हिसाब ठीक है — डीज़ल, टोल और किलोमीटर सब मेल खाते हैं। | The other <b>14 trips</b> add up — diesel, tolls and km all match. | |
| 23 | month card aria-label | सितंबर अब तक | September so far | |
| 24 | month card · flagged | सितंबर में फ़्लैग हुआ | Flagged in September | |
| 25 | month card · recovered | वापस मिला | Recovered | |
| 26 | weekly chart aria-label | हर हफ़्ते: फ़्लैग हुआ और वापस मिला | Flagged and recovered, week by week | |
| 27 | weekly chart caption | हर ब्लॉक ≈ ₹1,000 · चमकीले = वापस मिला | Each block ≈ ₹1,000 · lit = recovered | |
| 28 | Ask dock · label | Urja से पूछें | Ask Urja | |
| 29 | Ask dock · placeholder | कुछ भी पूछें, हिंदी या अंग्रेज़ी में… | Ask anything, in Hindi or English… | |
| 30 | Ask dock · button | पूछें | Ask | |
| 31 | language toggle aria-label | Language / भाषा | Language / भाषा | |

## 2. 7 AM message (/message), 27 Sep

lib/brief/template.ts `renderMessage`.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | title | सुबह 7 बजे का संदेश · Urja | 7 AM message · Urja | |
| 2 | h1 (screen readers) | सुबह 7 बजे का संदेश | 7 AM message | |
| 3 | chat header | Sharma Roadlines का हिसाब | Accounts for Sharma Roadlines | |
| 4 | day chip | आज | Today | |
| 5 | preview title | डीज़ल कहाँ गया? | Where did the diesel go? | |
| 6 | preview meta | आज का हिसाब · Sharma Roadlines | Today’s brief · Sharma Roadlines | |
| 7 | headline | कल: ₹1,86,400 कमाए · ₹11,430 का हिसाब नहीं | Yesterday: ₹1,86,400 earned · ₹11,430 doesn’t add up | |
| 8 | intro | 17 ट्रिप पूरी हुईं। इन 3 को देखें: | 17 trips finished. Look at these 3: | |
| 9 | item 1 | <b>RJ14 GB 4521</b> — बहरोड़ के पास, रात 2:14, खड़े ट्रक में 38 L डीज़ल कम। ₹3,420 · <b>पक्का</b> | <b>RJ14 GB 4521</b> — 38 L diesel down while parked near Behror, 2:14 AM. ₹3,420 · <b>High</b> | |
| 10 | item 2 | <b>RJ14 GA 1182</b> — बिल 250 L, टंकी में 200 L। ₹4,500 · <b>शायद</b> | <b>RJ14 GA 1182</b> — bill 250 L, tank rose 200 L. ₹4,500 · <b>Likely</b> | |
| 11 | item 3 | <b>RJ14 GC 3309</b> — भिवंडी ट्रिप में 39 L ज़्यादा डीज़ल। ₹3,510 · <b>जाँचें</b> | <b>RJ14 GC 3309</b> — 39 L more diesel than usual to Bhiwandi. ₹3,510 · <b>Check</b> | |
| 12 | clean line | बाकी 14 ट्रिप ठीक हैं ✓ | The other 14 trips are fine ✓ | |
| 13 | open the brief (link and preview aria-label) | पूरा हिसाब देखें | Open today’s brief | |
| 14 | quick reply 1 | रमेश से पूछो | Ask Ramesh | |
| 15 | quick reply 2 | सिर्फ़ पक्के वाले | Only high ones | |
| 16 | caption | ऐसे WhatsApp पर सुबह 7 बजे आता है (डिज़ाइन प्रोटोटाइप) | How it arrives on WhatsApp at 7 AM (design prototype) | |

## 3. Template variants not shown on 27 Sep

Other days, filters, driver states and the forms 27 Sep doesn't use.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | driver · confirmed | विक्रम ने मान लिया | Vikram confirmed | |
| 2 | driver · cleared | विक्रम की बात सही निकली | Cleared by Vikram | |
| 3 | items heading · 1 item | इस ट्रिप को देखें | Look at this trip | |
| 4 | items heading · none | आज देखने को कुछ नहीं | Nothing to look at today | |
| 5 | items heading · none High (?only=high) | कल कोई पक्का मामला नहीं | Nothing marked High yesterday | |
| 6 | ?only=high · note | सिर्फ़ पक्के वाले दिख रहे हैं | Showing only high ones | |
| 7 | ?only=high · show all | सभी 3 देखें | Show all 3 | |
| 8 | clean line · every trip adds up | सभी <b>17 ट्रिप</b> का हिसाब ठीक है — डीज़ल, टोल और किलोमीटर सब मेल खाते हैं। | All <b>17 trips</b> add up — diesel, tolls and km all match. | |
| 9 | clean line · one trip left | बाकी <b>1 ट्रिप</b> का हिसाब ठीक है — डीज़ल, टोल और किलोमीटर सब मेल खाते हैं। | The other <b>1 trip</b> adds up — diesel, tolls and km all match. | |
| 10 | 14-day chart · yesterday the highest | पिछले 2 दिन की कमाई, कल की कमाई सबसे ज़्यादा थी | Profit over the last 2 days; yesterday was the highest | |
| 11 | 14-day chart · yesterday lower | पिछले 4 दिन की कमाई; कल ₹1,00,000 | Profit over the last 4 days; yesterday ₹1,00,000 | |
| 12 | date line · 24 Sep brief | शुक्रवार, 25 सितंबर · कल की 17 ट्रिप का हिसाब | Friday, 25 September · yesterday’s 17 trips reconciled | |
| 13 | R1 while standing, ignition on (brief) | बहरोड़ के पास रुके ट्रक में 40 L डीज़ल का हिसाब नहीं — सुबह 8:38 बजे | 40 L diesel unaccounted while standing near Behror, 8:38 AM | |
| 14 | R1 while standing, ignition on (message) | बहरोड़ के पास, सुबह 8:38, रुके ट्रक में 40 L डीज़ल कम | 40 L diesel down while standing near Behror, 8:38 AM | |
| 15 | R1 with no town nearby (brief) | खड़े ट्रक में 40 L डीज़ल का हिसाब नहीं — सुबह 8:38 बजे | 40 L diesel unaccounted while parked, 8:38 AM | |
| 16 | brief leak line · 24 Sep, nothing unaccounted | सारा हिसाब ठीक है | Everything adds up | |
| 17 | message headline · 24 Sep, nothing unaccounted | कल: ₹1,94,800 कमाए · सारा हिसाब ठीक | Yesterday: ₹1,94,800 earned · everything adds up | |
| 18 | message intro · 24 Sep, no items | 17 ट्रिप पूरी हुईं। | 17 trips finished. | |
| 19 | message clean line · 24 Sep, every trip | सभी 17 ट्रिप ठीक हैं ✓ | All 17 trips are fine ✓ | |
| 20 | preview title · top flag not diesel | पैसा कहाँ गया? | Where did the money go? | |
| 21 | message intro · one trip, one item (agreement) | 1 ट्रिप पूरी हुई। इसे देखें: | 1 trip finished. Look at this one: | |
| 22 | message clean line · one trip left (agreement) | बाकी 1 ट्रिप ठीक है ✓ | The other trip is fine ✓ | |
| 23 | fallback for a flag with no evidence line | हिसाब नहीं मिल रहा | Doesn’t add up | |

## 4. Time words (§5.3)

lib/data/rules/text.ts `timeHi`: रात 9 PM–4 AM, सुबह 4 AM–12 PM, दोपहर 12–4 PM, शाम 4–9 PM.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | time | रात 3:59 | 3:59 AM | |
| 2 | time | सुबह 4:00 | 4:00 AM | |
| 3 | time | सुबह 11:59 | 11:59 AM | |
| 4 | time | दोपहर 12:00 | 12:00 PM | |
| 5 | time | दोपहर 3:59 | 3:59 PM | |
| 6 | time | शाम 4:00 | 4:00 PM | |
| 7 | time | शाम 8:59 | 8:59 PM | |
| 8 | time | रात 9:00 | 9:00 PM | |
| 9 | time | रात 2:14 | 2:14 AM | |

## 5. Dictionary

lib/brief/dict.ts.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | owner | शर्मा जी | Sharma ji | |
| 2 | confidence · high | पक्का | High | |
| 3 | confidence · likely | शायद | Likely | |
| 4 | confidence · check | जाँचें | Check | |
| 5 | weekday | रविवार | Sunday | |
| 6 | weekday | सोमवार | Monday | |
| 7 | weekday | मंगलवार | Tuesday | |
| 8 | weekday | बुधवार | Wednesday | |
| 9 | weekday | गुरुवार | Thursday | |
| 10 | weekday | शुक्रवार | Friday | |
| 11 | weekday | शनिवार | Saturday | |
| 12 | month | जनवरी | January | |
| 13 | month | फ़रवरी | February | |
| 14 | month | मार्च | March | |
| 15 | month | अप्रैल | April | |
| 16 | month | मई | May | |
| 17 | month | जून | June | |
| 18 | month | जुलाई | July | |
| 19 | month | अगस्त | August | |
| 20 | month | सितंबर | September | |
| 21 | month | अक्टूबर | October | |
| 22 | month | नवंबर | November | |
| 23 | month | दिसंबर | December | |
| 24 | short name for behror-pump | बहरोड़ | Behror | |
| 25 | short name for kishangarh-pump | किशनगढ़ | Kishangarh | |
| 26 | short name for beawar-pump | ब्यावर | Beawar | |
| 27 | short name for udaipur-pump | उदयपुर | Udaipur | |
| 28 | short name for himmatnagar-pump | हिम्मतनगर | Himmatnagar | |
| 29 | short name for vadodara-pump | वडोदरा | Vadodara | |
| 30 | short name for surat-pump | सूरत | Surat | |
| 31 | short name for neemrana-hp | नीमराना | Neemrana | |
| 32 | short name for okhla | दिल्ली | Delhi | |
| 33 | short name for jaipur-tn | जयपुर | Jaipur | |

## 6. Place, stretch and driver names

lib/data/places.ts, lib/data/routes.ts, lib/data/fleet.ts.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | place · jaipur | जयपुर | Jaipur | |
| 2 | place · delhi | दिल्ली | Delhi | |
| 3 | place · behror | बहरोड़ | Behror | |
| 4 | place · kishangarh | किशनगढ़ | Kishangarh | |
| 5 | place · beawar | ब्यावर | Beawar | |
| 6 | place · udaipur | उदयपुर | Udaipur | |
| 7 | place · himmatnagar | हिम्मतनगर | Himmatnagar | |
| 8 | place · ahmedabad | अहमदाबाद | Ahmedabad | |
| 9 | place · vadodara | वडोदरा | Vadodara | |
| 10 | place · bharuch | भरूच | Bharuch | |
| 11 | place · surat | सूरत | Surat | |
| 12 | place · vapi | वापी | Vapi | |
| 13 | place · mumbai | मुंबई | Mumbai | |
| 14 | place · jaipur-tn | जयपुर ट्रांसपोर्ट नगर | Jaipur Transport Nagar | |
| 15 | place · okhla | ओखला, दिल्ली | Okhla, Delhi | |
| 16 | place · manesar | मानेसर | Manesar | |
| 17 | place · bhiwandi | भिवंडी | Bhiwandi | |
| 18 | place · shahpura-dhaba | शाहपुरा ढाबा | Shahpura dhaba | |
| 19 | place · manoharpur-plaza | मनोहरपुर टोल प्लाज़ा | Manoharpur plaza | |
| 20 | place · behror-pump | बहरोड़ हाईवे पंप | Behror highway pump | |
| 21 | place · neemrana-hp | नीमराना एचपी पंप | HP pump Neemrana | |
| 22 | place · shahjahanpur-plaza | शाहजहाँपुर टोल प्लाज़ा | Shahjahanpur plaza | |
| 23 | place · kherki-daula-plaza | खेड़की दौला टोल प्लाज़ा | Kherki Daula plaza | |
| 24 | place · bagru-plaza | बगरू टोल प्लाज़ा | Bagru plaza | |
| 25 | place · kishangarh-pump | किशनगढ़ पंप | Kishangarh pump | |
| 26 | place · beawar-plaza | ब्यावर टोल प्लाज़ा | Beawar plaza | |
| 27 | place · beawar-pump | ब्यावर पंप | Beawar pump | |
| 28 | place · udaipur-plaza | उदयपुर टोल प्लाज़ा | Udaipur plaza | |
| 29 | place · udaipur-pump | उदयपुर पंप | Udaipur pump | |
| 30 | place · himmatnagar-pump | हिम्मतनगर पंप | Himmatnagar pump | |
| 31 | place · himmatnagar-plaza | हिम्मतनगर टोल प्लाज़ा | Himmatnagar plaza | |
| 32 | place · vadodara-pump | वडोदरा पंप | Vadodara pump | |
| 33 | place · vadodara-plaza | वडोदरा टोल प्लाज़ा | Vadodara plaza | |
| 34 | place · bharuch-plaza | भरूच टोल प्लाज़ा | Bharuch plaza | |
| 35 | place · surat-pump | सूरत पंप | Surat pump | |
| 36 | place · vapi-plaza | वापी टोल प्लाज़ा | Vapi plaza | |
| 37 | stretch · behror | बहरोड़ वाला हिस्सा | Behror stretch | |
| 38 | stretch · udaipur | उदयपुर वाला हिस्सा | Udaipur stretch | |
| 39 | driver · RJ14 GC 7710 | महेश मीणा | Mahesh Meena | |
| 40 | driver · RJ14 GA 2204 | सुरेश यादव | Suresh Yadav | |
| 41 | driver · RJ14 GB 1450 | इमरान ख़ान | Imran Khan | |
| 42 | driver · RJ14 GC 0931 | बलवंत सिंह | Balwant Singh | |
| 43 | driver · RJ14 GA 6618 | दीपक शर्मा | Deepak Sharma | |
| 44 | driver · RJ14 GB 3087 | राजेश सैनी | Rajesh Saini | |
| 45 | driver · RJ14 GA 7345 | मोहन लाल मेघवाल | Mohan Lal Meghwal | |
| 46 | driver · RJ14 GC 1268 | हरीश रावत | Harish Rawat | |
| 47 | driver · RJ14 GB 5590 | कमल किशोर | Kamal Kishore | |
| 48 | driver · RJ14 GA 4411 | प्रकाश बिश्नोई | Prakash Bishnoi | |
| 49 | driver · RJ14 GC 8826 | सलीम क़ुरैशी | Salim Qureshi | |
| 50 | driver · RJ14 GB 2903 | गोपाल प्रजापत | Gopal Prajapat | |
| 51 | driver · RJ14 GA 9152 | नरेश महावर | Naresh Mahawar | |
| 52 | driver · RJ14 GC 4470 | दिनेश जांगिड़ | Dinesh Jangid | |
| 53 | driver · RJ14 GB 6134 | जगदीश स्वामी | Jagdish Swami | |
| 54 | driver · RJ14 GA 3378 | राकेश वर्मा | Rakesh Verma | |
| 55 | driver · RJ14 GC 5021 | अशोक कुमावत | Ashok Kumawat | |
| 56 | driver · RJ14 GB 7716 | सुनील जोशी | Sunil Joshi | |
| 57 | driver · RJ14 GA 5023 | राजेंद्र सिंह | Rajendra Singh | |
| 58 | driver · RJ14 GC 2689 | फ़रहान अली | Farhan Ali | |
| 59 | driver · RJ14 GB 8352 | भूपेंद्र राठौड़ | Bhupendra Rathore | |
| 60 | driver · RJ14 GA 1182 | विक्रम चौधरी | Vikram Choudhary | |
| 61 | driver · RJ14 GB 4521 | रमेश कुमार | Ramesh Kumar | |
| 62 | driver · RJ14 GC 3309 | अनिल बैरवा | Anil Bairwa | |

## 7. Evidence lines on the flags

Built by lib/data/rules/* with the lib/data/rules/text.ts helpers; every distinct line in the dataset.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | R1 · 0905-03 · evidence (Fuel sensor) | 25 मिनट में फ़्यूल 291 → 251 लीटर गिरा | Fuel fell 291 → 251 L in 25 minutes | |
| 2 | R1 · 0905-03 · evidence (GPS · ignition) | इग्निशन बंद करके खड़ा था, सुबह 8:32–9:13 | Parked with ignition off, 8:32–9:13 AM | |
| 3 | R1 · 0905-03 · evidence (Geofence) | NH48 से 0.9 किमी दूर; सबसे नज़दीकी पंप 2.4 किमी दूर है | 0.9 km off NH48; nearest pump is 2.4 km away | |
| 4 | R1 · 0905-03 · evidence (Fleet history) | इसी हिस्से पर इस महीने 4 बार और फ़्लैग हुआ | Same stretch flagged 4 more times this month | |
| 5 | R1 · 0905-03 · why this confidence | बाकी ट्रिप में फ़्यूल सेंसर ±2 लीटर के अंदर रहा, इसलिए 40 लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग 20 गुना है। | The fuel sensor stayed within ±2 L for the rest of the trip, so a 40 L drop is about 20× its normal noise. | |
| 6 | R1 · 0905-03 · driver's side | फ़ोन पर बात के बाद माना। | Confirmed after a call. | |
| 7 | R1 · 0912-05 · evidence (Fuel sensor) | 50 मिनट में फ़्यूल 312 → 243 लीटर गिरा | Fuel fell 312 → 243 L in 50 minutes | |
| 8 | R1 · 0912-05 · evidence (GPS · ignition) | इग्निशन बंद करके खड़ा था, शाम 6:34–7:39 | Parked with ignition off, 6:34–7:39 PM | |
| 9 | R1 · 0912-05 · evidence (Geofence) | NH48 से 0.5 किमी दूर; सबसे नज़दीकी पंप 6.2 किमी दूर है | 0.5 km off NH48; nearest pump is 6.2 km away | |
| 10 | R1 · 0912-05 · why this confidence | बाकी ट्रिप में फ़्यूल सेंसर ±2 लीटर के अंदर रहा, इसलिए 69 लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग 35 गुना है। | The fuel sensor stayed within ±2 L for the rest of the trip, so a 69 L drop is about 35× its normal noise. | |
| 11 | R1 · 0921-09 · evidence (Fuel sensor) | 31 मिनट में फ़्यूल 291 → 248 लीटर गिरा | Fuel fell 291 → 248 L in 31 minutes | |
| 12 | R1 · 0921-09 · evidence (Geofence) | NH48 से 1.0 किमी दूर; सबसे नज़दीकी पंप 2.2 किमी दूर है | 1.0 km off NH48; nearest pump is 2.2 km away | |
| 13 | R1 · 0921-09 · why this confidence | बाकी ट्रिप में फ़्यूल सेंसर ±2 लीटर के अंदर रहा, इसलिए 42 लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग 21 गुना है। | The fuel sensor stayed within ±2 L for the rest of the trip, so a 42 L drop is about 21× its normal noise. | |
| 14 | R1 · 0923-02 · evidence (Fuel sensor) | 33 मिनट में फ़्यूल 213 → 165 लीटर गिरा | Fuel fell 213 → 165 L in 33 minutes | |
| 15 | R1 · 0923-02 · evidence (GPS · ignition) | इग्निशन बंद करके खड़ा था, रात 3:09–3:56 | Parked with ignition off, 3:09–3:56 AM | |
| 16 | R1 · 0923-02 · evidence (Geofence) | NH48 से 0.8 किमी दूर; सबसे नज़दीकी पंप 6.7 किमी दूर है | 0.8 km off NH48; nearest pump is 6.7 km away | |
| 17 | R1 · 0923-02 · why this confidence | बाकी ट्रिप में फ़्यूल सेंसर ±2 लीटर के अंदर रहा, इसलिए 48 लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग 24 गुना है। | The fuel sensor stayed within ±2 L for the rest of the trip, so a 48 L drop is about 24× its normal noise. | |
| 18 | R1 · 0923-02 · driver's side | अब तक ₹1,800 काटे गए। | ₹1,800 deducted so far. | |
| 19 | R1 · 0926-04 · evidence (Fuel sensor) | 26 मिनट में फ़्यूल 168 → 130 लीटर गिरा | Fuel fell 168 → 130 L in 26 minutes | |
| 20 | R1 · 0926-04 · evidence (GPS · ignition) | इग्निशन बंद करके खड़ा था, रात 2:08–2:44 | Parked with ignition off, 2:08–2:44 AM | |
| 21 | R1 · 0926-04 · evidence (Geofence) | NH48 से 1.6 किमी दूर; सबसे नज़दीकी पंप 3.1 किमी दूर है | 1.6 km off NH48; nearest pump is 3.1 km away | |
| 22 | R1 · 0926-04 · why this confidence | बाकी ट्रिप में फ़्यूल सेंसर ±2 लीटर के अंदर रहा, इसलिए 38 लीटर की गिरावट उसके सामान्य उतार-चढ़ाव से लगभग 19 गुना है। | The fuel sensor stayed within ±2 L for the rest of the trip, so a 38 L drop is about 19× its normal noise. | |
| 23 | R2 · 0927-02 · evidence (Fuel bill) | बिल में 250 लीटर (₹22,500); टंकी में 200 लीटर बढ़ा | Bill says 250 L (₹22,500); the tank rose 200 L | |
| 24 | R2 · 0927-02 · evidence (Fuel sensor) | टंकी भरने से 5 मिनट पहले और 10 मिनट बाद पढ़ा गया | Tank read 5 min before and 10 min after the fill | |
| 25 | R2 · 0927-02 · evidence (Geofence) | किशनगढ़ पंप, शाम 4:50 | Kishangarh pump, 4:50 PM | |
| 26 | R2 · 0927-02 · why this confidence | ‘शायद’ से ऊपर नहीं: बिल में कैन या दूसरी टंकी का डीज़ल भी हो सकता है, और पंप-मीटर का रिकॉर्ड नहीं है। | Capped at Likely: a bill can also cover cans or a second tank, and there is no pump-meter record to check against. | |
| 27 | R2 · 0927-02 · driver's side | नोज़ल जल्दी रुक गया था; मैंने अटेंडेंट को बताया था। | The nozzle stopped early; I told the attendant. | |
| 28 | R3 · 0909-03 · evidence (Fleet history) | 225 लीटर लगा; इस रूट पर इस ट्रक की आम खपत 187 लीटर है (20% ज़्यादा) | Used 225 L; this truck's normal on this route is 187 L (20% more) | |
| 29 | R3 · 0909-03 · evidence (Fuel sensor) | पूरी ट्रिप में फैला हुआ, किसी एक जगह नहीं | Spread across the trip, no single stop | |
| 30 | R3 · 0909-03 · evidence (Trip plan) | लोड 27 टन (आम तौर पर 22 टन) | Load 27 t (usual 22 t) | |
| 31 | R3 · 0909-03 · why this confidence | जाँचें: ट्रक में आम 22 टन की जगह 27 टन था, और आम खपत में लोड नहीं जुड़ता, इसलिए ज़्यादा डीज़ल लोड की वजह से भी हो सकता है। | Check: the truck carried 27 t against a usual 22 t, and the normal doesn't allow for load, so the extra diesel may be the load. | |
| 32 | R3 · 0909-03 · driver's side | भारी लोड, घाट पर धीमे चले। | Heavy load, slow ghats. | |
| 33 | R3 · 0917-06 · evidence (Fleet history) | 373 लीटर लगा; इस रूट पर इस ट्रक की आम खपत 325 लीटर है (15% ज़्यादा) | Used 373 L; this truck's normal on this route is 325 L (15% more) | |
| 34 | R3 · 0917-06 · evidence (Trip plan) | लोड 22 टन, आम 22 टन के अंदर | Load 22 t, within the usual 22 t | |
| 35 | R3 · 0917-06 · why this confidence | आम से 48 लीटर ज़्यादा, 12% की सीमा के करीब है; घाट या जाम से भी कुछ हिस्सा हो सकता है। | 48 L over normal is close to the 12% allowance; slow ghats or traffic could explain part of it. | |
| 36 | R3 · 0917-06 · driver's side | नोट किया। | Noted. | |
| 37 | R3 · 0926-11 · evidence (Fleet history) | 364 लीटर लगा; इस रूट पर इस ट्रक की आम खपत 325 लीटर है (12% ज़्यादा) | Used 364 L; this truck's normal on this route is 325 L (12% more) | |
| 38 | R3 · 0926-11 · evidence (Trip plan) | लोड 26 टन (आम तौर पर 22 टन) | Load 26 t (usual 22 t) | |
| 39 | R3 · 0926-11 · why this confidence | जाँचें: ट्रक में आम 22 टन की जगह 26 टन था, और आम खपत में लोड नहीं जुड़ता, इसलिए ज़्यादा डीज़ल लोड की वजह से भी हो सकता है। | Check: the truck carried 26 t against a usual 22 t, and the normal doesn't allow for load, so the extra diesel may be the load. | |
| 40 | R4 · 0901-04 · evidence (Trip plan) | तय 662 किमी की जगह 721 किमी चला (+9%) | Drove 721 km against a planned 662 km (+9%) | |
| 41 | R4 · 0901-04 · evidence (Geofence) | रात 12:59 से रात 3:25 तक 92.5 किमी तय रास्ते से हटकर चला | Left the planned route for 92.5 km, 12:59 AM to 3:25 AM | |
| 42 | R4 · 0901-04 · evidence (Fleet history) | 59.3 किमी ज़्यादा, इस ट्रक के 3.62 किमी/लीटर पर = ₹1,480 का डीज़ल | 59.3 extra km at this truck's 3.62 km/L = ₹1,480 of diesel | |
| 43 | R4 · 0901-04 · why this confidence | GPS ने पूरी ट्रिप बिना रुकावट दर्ज की, और ज़्यादा दूरी 6% की सीमा से काफ़ी ऊपर है। | GPS tracked the whole trip with no gaps, and the extra distance is well past the 6% allowance. | |
| 44 | R4 · 0905-06 · evidence (Trip plan) | तय 662 किमी की जगह 713 किमी चला (+8%) | Drove 713 km against a planned 662 km (+8%) | |
| 45 | R4 · 0905-06 · evidence (Geofence) | सुबह 5:32 से सुबह 11:21 तक 79.8 किमी तय रास्ते से हटकर चला | Left the planned route for 79.8 km, 5:32 AM to 11:21 AM | |
| 46 | R4 · 0905-06 · evidence (Fleet history) | 51.2 किमी ज़्यादा, इस ट्रक के 3.45 किमी/लीटर पर = ₹1,340 का डीज़ल | 51.2 extra km at this truck's 3.45 km/L = ₹1,340 of diesel | |
| 47 | R4 · 0912-08 · evidence (Geofence) | रात 1:18 से रात 2:49 तक 79.5 किमी तय रास्ते से हटकर चला | Left the planned route for 79.5 km, 1:18 AM to 2:49 AM | |
| 48 | R4 · 0912-08 · evidence (Fleet history) | 51.0 किमी ज़्यादा, इस ट्रक के 3.64 किमी/लीटर पर = ₹1,260 का डीज़ल | 51.0 extra km at this truck's 3.64 km/L = ₹1,260 of diesel | |
| 49 | R4 · 0915-05 · evidence (Trip plan) | तय 662 किमी की जगह 708 किमी चला (+7%) | Drove 708 km against a planned 662 km (+7%) | |
| 50 | R4 · 0915-05 · evidence (Geofence) | शाम 8:45 से रात 10:12 तक 71.2 किमी तय रास्ते से हटकर चला | Left the planned route for 71.2 km, 8:45 PM to 10:12 PM | |
| 51 | R4 · 0915-05 · evidence (Fleet history) | 45.6 किमी ज़्यादा, इस ट्रक के 3.58 किमी/लीटर पर = ₹1,150 का डीज़ल | 45.6 extra km at this truck's 3.58 km/L = ₹1,150 of diesel | |
| 52 | R4 · 0919-04 · evidence (Trip plan) | तय 662 किमी की जगह 706 किमी चला (+7%) | Drove 706 km against a planned 662 km (+7%) | |
| 53 | R4 · 0919-04 · evidence (Geofence) | रात 10:48 से रात 12:12 तक 68.7 किमी तय रास्ते से हटकर चला | Left the planned route for 68.7 km, 10:48 PM to 12:12 AM | |
| 54 | R4 · 0919-04 · evidence (Fleet history) | 44.3 किमी ज़्यादा, इस ट्रक के 3.45 किमी/लीटर पर = ₹1,160 का डीज़ल | 44.3 extra km at this truck's 3.45 km/L = ₹1,160 of diesel | |
| 55 | R4 · 0920-06 · evidence (Trip plan) | तय 1,150 किमी की जगह 1,412 किमी चला (+23%) | Drove 1,412 km against a planned 1,150 km (+23%) | |
| 56 | R4 · 0920-06 · evidence (Geofence) | रात 11:54 से दोपहर 1:09 तक 379.8 किमी तय रास्ते से हटकर चला | Left the planned route for 379.8 km, 11:54 PM to 1:09 PM | |
| 57 | R4 · 0920-06 · evidence (Fleet history) | 261.6 किमी ज़्यादा, इस ट्रक के 3.47 किमी/लीटर पर = ₹6,780 का डीज़ल | 261.6 extra km at this truck's 3.47 km/L = ₹6,780 of diesel | |
| 58 | R4 · 0920-06 · driver's side | हादसे के बाद हाईवे बंद था; पुलिस ने दूसरे रास्ते भेजा। | The highway was closed after an accident; police diverted us. | |
| 59 | R5 · 0831-02 · evidence (FASTag) | टोल के ₹8,620 माँगे; FASTag में 7 प्लाज़ा पर ₹7,400 | Claimed ₹8,620 for tolls; FASTag shows ₹7,400 at 7 plazas | |
| 60 | R5 · 0831-02 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹1,220 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹1,220 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 61 | R5 · 0903-08 · evidence (FASTag) | टोल के ₹5,050 माँगे; FASTag में 4 प्लाज़ा पर ₹4,290 | Claimed ₹5,050 for tolls; FASTag shows ₹4,290 at 4 plazas | |
| 62 | R5 · 0903-08 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹760 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹760 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 63 | R5 · 0906-04 · evidence (FASTag) | टोल के ₹8,480 माँगे; FASTag में 7 प्लाज़ा पर ₹7,400 | Claimed ₹8,480 for tolls; FASTag shows ₹7,400 at 7 plazas | |
| 64 | R5 · 0906-04 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹1,080 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹1,080 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 65 | R5 · 0907-07 · evidence (FASTag) | टोल के ₹4,920 माँगे; FASTag में 4 प्लाज़ा पर ₹4,290 | Claimed ₹4,920 for tolls; FASTag shows ₹4,290 at 4 plazas | |
| 66 | R5 · 0907-07 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹630 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹630 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 67 | R5 · 0909-07 · evidence (FASTag) | टोल के ₹8,850 माँगे; FASTag में 7 प्लाज़ा पर ₹7,400 | Claimed ₹8,850 for tolls; FASTag shows ₹7,400 at 7 plazas | |
| 68 | R5 · 0909-07 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹1,450 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹1,450 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 69 | R5 · 0909-07 · driver's side | प्लाज़ा पर FASTag नहीं पढ़ा गया; मैंने नकद दिया और रसीद दिखाई। | The FASTag didn't read at the plaza; I paid cash and have the receipt. | |
| 70 | R5 · 0913-07 · evidence (FASTag) | टोल के ₹5,520 माँगे; FASTag में 4 प्लाज़ा पर ₹4,290 | Claimed ₹5,520 for tolls; FASTag shows ₹4,290 at 4 plazas | |
| 71 | R5 · 0913-07 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹1,230 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹1,230 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 72 | R5 · 0914-03 · evidence (FASTag) | टोल के ₹5,190 माँगे; FASTag में 4 प्लाज़ा पर ₹4,290 | Claimed ₹5,190 for tolls; FASTag shows ₹4,290 at 4 plazas | |
| 73 | R5 · 0914-03 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹900 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹900 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |
| 74 | R5 · 0917-05 · evidence (FASTag) | टोल के ₹5,010 माँगे; FASTag में 4 प्लाज़ा पर ₹4,290 | Claimed ₹5,010 for tolls; FASTag shows ₹4,290 at 4 plazas | |
| 75 | R5 · 0917-05 · why this confidence | FASTag की कटौती पक्का रिकॉर्ड है, और दावा उससे ₹720 ज़्यादा है। अगर किसी प्लाज़ा पर टैग नहीं पढ़ा गया और नकद दिया गया, तो रसीद माँगें। | FASTag deductions are exact records, and the claim is ₹720 above them. A plaza that failed to read the tag and took cash would explain it; ask for the receipt. | |

## 8. Phone menu

components/shell/nav.ts `menuLinks`, `MENU_COPY`: the menu on the Hindi /brief and /message (EXE23).

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | item · /brief | सुबह का हिसाब | Morning brief | |
| 2 | item · / | आज | Today | |
| 3 | item · /#trucks | ट्रक | Trucks | |
| 4 | item · /trips | ट्रिप | Trips | |
| 5 | item · /why | Urja क्यों | Why Urja | |
| 6 | item · /bet | दाँव | The bet | |
| 7 | item · Ask | Urja से पूछें | Ask Urja | |
| 8 | menu button aria-label | मेनू | Menu | |
| 9 | menu list aria-label | मुख्य मेनू | Main (mobile) | |

## 9. Ask drawer

components/ask/copy.ts `ASK_COPY`, `ASK_CHIPS`; components/ask/askScope.ts: the drawer on the Hindi /brief and /message (EXE23).

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | title (dialog name) | Urja से पूछें | Ask Urja | |
| 2 | close button aria-label | Urja से पूछें बंद करें | Close Ask Urja | |
| 3 | input label (screen readers) | आपका सवाल | Your question | |
| 4 | input placeholder | हिंदी या अंग्रेज़ी में पूछें… | Ask in Hindi or English… | |
| 5 | send button | पूछें | Ask | |
| 6 | chips group aria-label | सुझाए गए सवाल | Suggested questions | |
| 7 | chip 1 (the question it sends) | कौन-सा ट्रक प्रति किलोमीटर सबसे कम कमाता है, और क्यों? | Which truck earns least per km, and why? | |
| 8 | chip 2 (the question it sends) | पिछले हफ़्ते कितने डीज़ल का हिसाब नहीं मिला? | How much diesel went unaccounted last week? | |
| 9 | chip 3 (the question it sends) | बहरोड़ वाले हिस्से के सारे फ़्लैग दिखाएँ | Show every flag on the Behror stretch | |
| 10 | answering | Gemini से पूछ रहे हैं… | Asking Gemini… | |
| 11 | fallback banner | Urja का AI अभी जवाब नहीं दे पाया, इसलिए यह आँकड़ा सीधे आपके डेटा से है। | Urja’s AI couldn’t answer right now, so here is the number straight from your data. | |
| 12 | saved banner (the fallback banner's first clause) | Urja का AI अभी जवाब नहीं दे पाया। | Urja’s AI couldn’t answer right now. | |
| 13 | error line | Urja अपने सर्वर तक नहीं पहुँच पाया, इसलिए इस सवाल का जवाब अभी नहीं है। कुछ खोया नहीं है: आपका सवाल नीचे बॉक्स में ही है। | Urja couldn’t reach its server, so this question has no answer yet. Nothing is lost: your question is still in the box below. | |
| 14 | saved answer (a question with no prepared answer) | आपका सवाल सहेज लिया गया है। लिखित जवाब के लिए एक मिनट बाद फिर पूछें। | Your question is saved. Try again in a minute for a written answer. | |
| 15 | refusal · off-topic question (weather, prices, forecasts) when the model can't answer | मेरे पास इसका डेटा नहीं है। मैं सिर्फ़ शर्मा रोडलाइंस के अपने ट्रिप, ट्रक, डीज़ल और पैसों का हिसाब जानता हूँ, उनके बारे में पूछें। | I don't have that data. I only know Sharma Roadlines' own trips, trucks, diesel and money, so ask me about those. | |
| 16 | refusal · a request for the instructions or a key when the model can't answer | मैं यह नहीं बता सकता: अपने निर्देश या कोई key मैं किसी से साझा नहीं करता। अपने ट्रिप, ट्रक, डीज़ल या पैसों के बारे में पूछें। | I can't answer that: I don't share my instructions or any key. Ask me about your trips, trucks, diesel or money. | |
| 17 | 429 heading (12 s left) | आपने पिछले एक मिनट में बहुत सवाल पूछे हैं। 12 सेकंड बाद फिर पूछें। | You’ve asked a lot in the last minute. Ask again in 12 s. | |
| 18 | 429 heading, once the wait is over | अब आप फिर से पूछ सकते हैं। | You can ask again now. | |
| 19 | 429 heading, a daily cap (no countdown, no try again) | आज के सवालों की सीमा पूरी हो गई है। कल फिर पूछें। | That’s today’s limit of questions. Ask again tomorrow. | |
| 20 | 429 saved line | आपका सवाल सहेज लिया गया है। | Your question is saved. | |
| 21 | try again button | फिर से कोशिश करें | Try again | |
| 22 | try again button, disabled during a 429 (12 s left) | 12 सेकंड बाद फिर से कोशिश करें | Try again in 12 s | |
| 23 | cited trips aria-label | इस जवाब में इस्तेमाल हुई ट्रिप | Trips this answer used | |
| 24 | cite chip (0926-04) | ट्रिप 0926-04 | Trip 0926-04 | |
| 25 | provenance scope (from the data) | 212 ट्रिप, 24 ट्रक, 1–27 सितंबर | 212 trips across 24 trucks, 1–27 Sep | |
| 26 | provenance line · model answer | 212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · Gemini 3.5 Flash · 1.8 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें। | From 212 trips across 24 trucks, 1–27 Sep · Gemini 3.5 Flash · answered in 1.8 s · Urja can be wrong, so open the trips before acting. | |
| 27 | provenance line · fallback answer | 212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · AI के बिना, सीधा हिसाब · 0.04 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें। | From 212 trips across 24 trucks, 1–27 Sep · straight from your data, no AI · answered in 0.04 s · Urja can be wrong, so open the trips before acting. | |

## 10. Ask answers

lib/ask/labels.ts `STATUS_LABEL`, `RULE_LABEL`, `tripLabel`; lib/ask/fallback.ts: the cited-trip labels, the Check caveat a model answer gets, and the answers Urja gives without the AI (one per prepared question), for a Hindi question.

| # | Where | Hindi | English | Reviewer |
|---|---|---|---|---|
| 1 | flag status · waiting | आपके फ़ैसले का इंतज़ार | waiting for you | |
| 2 | flag status · confirmed | आपने माना | confirmed | |
| 3 | flag status · wrong | ग़लत निकला | marked wrong | |
| 4 | rule · R1 | खड़े ट्रक में डीज़ल घटा | Stationary fuel drop | |
| 5 | rule · R2 | बिल और टंकी में फ़र्क | Refuel mismatch | |
| 6 | rule · R3 | सामान्य से ज़्यादा डीज़ल | Excess consumption | |
| 7 | rule · R4 | तय रास्ते से हटकर | Route deviation | |
| 8 | rule · R5 | टोल में फ़र्क | Toll mismatch | |
| 9 | Check caveat · every cited flag is a Check | ये ‘जाँचें’ वाले फ़्लैग हैं: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं। | These are Check flags: the extra use can have other causes, such as a heavier load. | |
| 10 | Check caveat · one of the cited trips (0926-11) | ट्रिप 0926-11 ‘जाँचें’ वाला फ़्लैग है: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं। | Trip 0926-11 is a Check flag: the extra use can have other causes, such as a heavier load. | |
| 11 | Check caveat · two of the cited trips | ट्रिप 0909-03 और 0917-06 ‘जाँचें’ वाले फ़्लैग हैं: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं। | Trips 0909-03 and 0917-06 are Check flags: the extra use can have other causes, such as a heavier load. | |
| 12 | cited trip · a flag with litres (0926-11) | जयपुर → भिवंडी, 26 सितंबर: 39 लीटर · सामान्य से ज़्यादा डीज़ल | Jaipur → Bhiwandi, 26 Sep: 39 L · Excess consumption | |
| 13 | cited trip · a flag with no litres (0909-07) | भिवंडी → जयपुर, 9 सितंबर: टोल में फ़र्क | Bhiwandi → Jaipur, 9 Sep: Toll mismatch | |
| 14 | cited trip · no flag (0926-07) | जयपुर → अहमदाबाद, 26 सितंबर | Jaipur → Ahmedabad, 26 Sep | |
| 15 | cited trip · cites span trucks, so the plate leads (0927-02) | RJ14 GA 1182 · अहमदाबाद → जयपुर, 27 सितंबर: 50 लीटर · बिल और टंकी में फ़र्क | RJ14 GA 1182 · Ahmedabad → Jaipur, 27 Sep: 50 L · Refuel mismatch | |
| 16 | answer · driver with the most diesel unaccounted | इस महीने सबसे ज़्यादा डीज़ल का हिसाब अनिल बैरवा (RJ14 GC 3309) का नहीं मिल रहा: 3 ट्रिप में 125 लीटर (₹11,250) — 0926-11 (39 लीटर); 0917-06 (48 लीटर); 0909-03 (38 लीटर)। ये सब ‘जाँचें’ वाले फ़्लैग हैं: ज़्यादा खपत की दूसरी वजहें भी हो सकती हैं, जैसे भारी लोड। | Anil Bairwa (RJ14 GC 3309) had the most diesel unaccounted this month: 125 L (₹11,250) more than normal on 3 trips — 0926-11 (39 L); 0917-06 (48 L); 0909-03 (38 L). All of them are Check flags: the extra use can have other causes, such as a heavier load. | |
| 17 | answer · last week's diesel | पिछले हफ़्ते (21–27 सितंबर) 5 ट्रिप में 217 लीटर डीज़ल (₹19,530) का हिसाब नहीं मिल रहा: 0921-09 (RJ14 GB 7716, 42 लीटर); 0923-02 (RJ14 GA 5023, 48 लीटर); 0926-04 (RJ14 GB 4521, 38 लीटर); 0927-02 (RJ14 GA 1182, 50 लीटर); 0926-11 (RJ14 GC 3309, 39 लीटर)। | Last week (21–27 Sep), 217 L of diesel (₹19,530) was unaccounted on 5 trips: 0921-09 (RJ14 GB 7716, 42 L); 0923-02 (RJ14 GA 5023, 48 L); 0926-04 (RJ14 GB 4521, 38 L); 0927-02 (RJ14 GA 1182, 50 L); 0926-11 (RJ14 GC 3309, 39 L). | |
| 18 | answer · least per km, and why | सबसे कम कमाई प्रति किलोमीटर RJ14 GC 3309 (अनिल बैरवा) की है: सितंबर में ₹12.7 प्रति किलोमीटर, 7,410 किलोमीटर में। वजह: 3 ट्रिप (0926-11, 0917-06, 0909-03) में सामान्य से 125 लीटर डीज़ल (₹11,250) ज़्यादा लगा। ये ‘जाँचें’ वाले फ़्लैग हैं: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं। | RJ14 GC 3309 (Anil Bairwa) earns the least: ₹12.7 per km in September, over 7,410 km. Why: it used 125 L of diesel (₹11,250) more than normal on 3 trips (0926-11, 0917-06, 0909-03). These are Check flags: the extra use can have other causes, such as a heavier load. | |
| 19 | answer · best per km | सबसे ज़्यादा कमाई प्रति किलोमीटर RJ14 GC 7710 (महेश मीणा) की है: सितंबर में ₹31.8 प्रति किलोमीटर, 6,840 किलोमीटर में, कोई फ़्लैग नहीं। | RJ14 GC 7710 (Mahesh Meena) earns the most: ₹31.8 per km in September, over 6,840 km, with no flags. | |
| 20 | answer · flags on the Behror stretch | सितंबर में बहरोड़ वाले हिस्से पर 5 फ़्लैग, कुल 237 लीटर (₹21,330): 0905-03 (RJ14 GA 1182, 5 सितंबर, 40 लीटर, आपने माना); 0912-05 (RJ14 GB 4521, 12 सितंबर, 69 लीटर, आपने माना); 0921-09 (RJ14 GB 7716, 21 सितंबर, 42 लीटर, आपने माना); 0923-02 (RJ14 GA 5023, 23 सितंबर, 48 लीटर, आपने माना); 0926-04 (RJ14 GB 4521, 27 सितंबर, 38 लीटर, आपके फ़ैसले का इंतज़ार)। | 5 flags on the Behror stretch in September, 237 L (₹21,330) in all: 0905-03 (RJ14 GA 1182, 5 Sep, 40 L, confirmed); 0912-05 (RJ14 GB 4521, 12 Sep, 69 L, confirmed); 0921-09 (RJ14 GB 7716, 21 Sep, 42 L, confirmed); 0923-02 (RJ14 GA 5023, 23 Sep, 48 L, confirmed); 0926-04 (RJ14 GB 4521, 27 Sep, 38 L, waiting for you). | |
| 21 | answer · yesterday's summary | कल (रवि 27 सितंबर) 17 ट्रिप से ₹1,86,400 की कमाई हुई। 3 ट्रिप में ₹11,430 (127 लीटर डीज़ल) का हिसाब नहीं मिल रहा: 0926-04 (RJ14 GB 4521, ₹3,420, पक्का); 0927-02 (RJ14 GA 1182, ₹4,500, शायद); 0926-11 (RJ14 GC 3309, ₹3,510, जाँचें)। बाकी 14 ट्रिप का हिसाब मिल रहा है। | Yesterday (Sun 27 Sep) you earned ₹1,86,400 on 17 trips. ₹11,430 (127 L of diesel) doesn't add up, across 3 trips: 0926-04 (RJ14 GB 4521, ₹3,420, High); 0927-02 (RJ14 GA 1182, ₹4,500, Likely); 0926-11 (RJ14 GC 3309, ₹3,510, Check). The other 14 trips add up. | |
| 22 | answer · recovered this month | इस महीने ₹58,240 के फ़्लैग में से ₹21,600 वापस मिले (37%)। | This month you have recovered ₹21,600 of the ₹58,240 flagged (37%). | |
| 23 | answer · how often Urja was wrong | इस महीने 23 फ़्लैग में से 2 ग़लत निकले (9%), 10% की सीमा से कम: 0909-07 (टोल में फ़र्क: “प्लाज़ा पर FASTag नहीं पढ़ा गया; मैंने नकद दिया और रसीद दिखाई।”); 0920-06 (तय रास्ते से हटकर: “हादसे के बाद हाईवे बंद था; पुलिस ने दूसरे रास्ते भेजा।”)। | Urja was wrong 2 of 23 times this month (9%), under the 10% limit. The driver's side explained both: 0909-07 (Toll mismatch: “The FASTag didn't read at the plaza; I paid cash and have the receipt.”); 0920-06 (Route deviation: “The highway was closed after an accident; police diverted us.”). | |
| 24 | answer · one truck's flags yesterday (RJ14 GA 1182) | ट्रिप 0927-02 (RJ14 GA 1182, विक्रम चौधरी): 27 सितंबर शाम 4:50 किशनगढ़ पंप पर बिल 250 लीटर का है, पर टंकी सिर्फ़ 200 लीटर बढ़ी; 50 लीटर (₹4,500) का हिसाब नहीं मिल रहा। भरोसा: शायद। ‘शायद’ से ऊपर नहीं: बिल में कैन या दूसरी टंकी का डीज़ल भी हो सकता है, और पंप-मीटर का रिकॉर्ड नहीं है। स्थिति: आपके फ़ैसले का इंतज़ार। विक्रम का जवाब: “नोज़ल जल्दी रुक गया था; मैंने अटेंडेंट को बताया था।” | Trip 0927-02 (RJ14 GA 1182, Vikram Choudhary): at the Kishangarh pump, 4:50 PM on 27 Sep, the bill says 250 L but the tank rose only 200 L, so 50 L (₹4,500) doesn't add up. Confidence: Likely. Capped at Likely: a bill can also cover cans or a second tank, and there is no pump-meter record to check against. Status: waiting for you. Vikram's side: “The nozzle stopped early; I told the attendant.” | |
| 25 | answer · a truck with no September flag (RJ14 GC 7710) | सितंबर में RJ14 GC 7710 (महेश मीणा) पर कोई फ़्लैग नहीं: 11 ट्रिप, ₹31.8 प्रति किलोमीटर। | RJ14 GC 7710 (Mahesh Meena) has no flags in September: 11 trips at ₹31.8 per km. | |
| 26 | answer · a truck whose trips yesterday add up (RJ14 GC 7710) | कल (27 सितंबर) RJ14 GC 7710 (महेश मीणा) की 1 ट्रिप पर कोई फ़्लैग नहीं: डीज़ल, टोल और किलोमीटर का हिसाब मिल रहा है। | RJ14 GC 7710 (Mahesh Meena) has no flag on yesterday's trip (27 Sep): diesel, tolls and km add up. | |
| 27 | answer · a truck with no trip ending yesterday (RJ14 GC 0931) | RJ14 GC 0931 (बलवंत सिंह) की कोई ट्रिप कल (27 सितंबर) ख़त्म नहीं हुई, इसलिए कोई फ़्लैग नहीं है। | No trip of RJ14 GC 0931 (Balwant Singh) ended yesterday (27 Sep), so there is no flag to show. | |
