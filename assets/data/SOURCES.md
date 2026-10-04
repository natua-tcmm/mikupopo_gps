# 行政区域データの出典

- 元データ: 国土交通省「国土数値情報（行政区域データ）」N03-22_220101、2022年1月1日時点
  https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03.html
- 配布元: Geolonia japanese-admins
  https://github.com/geolonia/japanese-admins
- 変換元: 同リポジトリ `docs/<都道府県コード>/<市区町村コード>.json`
- 配布元のライセンス: MIT（同梱の LICENSE-geolonia.txt）

加工内容: Douglas–Peucker法で許容幅0.00005度、トポロジーを保持して簡略化し、小数点以下6桁に丸めています。
政令指定都市の区名と支庁名は表示用の名称から除いています。郡名および東京都の特別区名は保持しています。
座標は100万倍した符号付き32ビット整数としてバイナリ形式に格納しています。元データを国土交通省が承認した加工品という意味ではありません。

MKG1形式（全てlittle-endian）:
4バイトのマジック値、uint32領域数。各領域はuint32名称ID、uint32ポリゴン数、int32境界ボックス4要素。
各ポリゴンはuint32リング数。各リングはuint32頂点数、続いてint32経度・緯度の組です。
名称IDはmunicipalities.jsonのnames配列を参照します。
