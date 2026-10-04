# 今日の美紅はここにいるよ

にじさんじ所属VTuber「猫屋敷美紅」の推し活に！HTML・CSS・JavaScriptだけで動作する、日本国内向けのGPS表示アプリです。
画面のダブルタップもしくはFキーで全画面表示に切り替えることができます。また、PWAにも対応しております。

アプリは同じ配信元のファイルだけを読み込み、**緯度経度を送信・保存しません**。住所の判定は端末内で行います。
外部のフォント配信、住所検索API、地図サービス、解析ツールは利用しません。
Content Security Policyで外部ドメインへの接続も制限しています。
Google Fontsのフォントファイルも同梱しています。


## 行政区域データ

国土交通省「[国土数値情報・行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03.html)」を加工した
[Geolonia japanese-admins](https://github.com/geolonia/japanese-admins)の **2022年1月1日時点** の全国データを同梱しています。
約5m程度の許容幅で形状を簡略化し、整数マイクロ度のバイナリに変換しています。離島、複数の領域、飛び地、穴を保持します。

境界付近ではGPSの誤差や簡略化の影響があり、2022年以降の行政区域の変更は反映されていません。
海上・国外・データの対象外では、座標は表示し、地域名は「市区町村を特定できません」と表示します。

`assets/data/LICENSE-geolonia.txt`にGeoloniaのMITライセンスを収録しています。
元の行政区域データの出典・加工内容は `assets/data/SOURCES.md` に記載しています。
フォントの[SIL Open Font License](https://github.com/google/fonts/blob/main/ofl/mochiypopone/OFL.txt)は `assets/fonts/OFL.txt` に収録しています。
