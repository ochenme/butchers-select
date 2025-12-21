import React, { useEffect, useRef, useState } from 'react';
import { search711Stores } from '../services/shipping/711';

export type SevenElevenStoreItem = {
  id: string;
  name: string;
  address?: string;
};

type SevenElevenStoreAutocompleteProps = {
  city: string;
  town?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (store: SevenElevenStoreItem) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  inputClassName?: string;
};

const CITY_TOWNS: Record<string, string[]> = {
  台北市: ['松山區', '信義區', '大安區', '中山區', '中正區', '大同區', '萬華區', '文山區', '南港區', '內湖區', '士林區', '北投區'],
  臺北市: ['松山區', '信義區', '大安區', '中山區', '中正區', '大同區', '萬華區', '文山區', '南港區', '內湖區', '士林區', '北投區'],
  新北市: [
    '板橋區',
    '中和區',
    '永和區',
    '土城區',
    '三峽區',
    '樹林區',
    '鶯歌區',
    '三重區',
    '新莊區',
    '泰山區',
    '林口區',
    '蘆洲區',
    '五股區',
    '八里區',
    '淡水區',
    '三芝區',
    '石門區',
    '金山區',
    '萬里區',
    '汐止區',
    '瑞芳區',
    '貢寮區',
    '平溪區',
    '雙溪區',
    '新店區',
    '深坑區',
    '石碇區',
    '坪林區',
    '烏來區',
  ],
  桃園市: [
    '桃園區',
    '中壢區',
    '平鎮區',
    '八德區',
    '楊梅區',
    '蘆竹區',
    '大溪區',
    '龜山區',
    '龍潭區',
    '大園區',
    '觀音區',
    '新屋區',
    '復興區',
  ],
  台中市: [
    '中區',
    '東區',
    '南區',
    '西區',
    '北區',
    '西屯區',
    '南屯區',
    '北屯區',
    '豐原區',
    '東勢區',
    '大甲區',
    '清水區',
    '沙鹿區',
    '梧棲區',
    '后里區',
    '神岡區',
    '潭子區',
    '大雅區',
    '新社區',
    '石岡區',
    '外埔區',
    '大安區',
    '烏日區',
    '大肚區',
    '龍井區',
    '霧峰區',
    '太平區',
    '大里區',
    '和平區',
  ],
  臺中市: [
    '中區',
    '東區',
    '南區',
    '西區',
    '北區',
    '西屯區',
    '南屯區',
    '北屯區',
    '豐原區',
    '東勢區',
    '大甲區',
    '清水區',
    '沙鹿區',
    '梧棲區',
    '后里區',
    '神岡區',
    '潭子區',
    '大雅區',
    '新社區',
    '石岡區',
    '外埔區',
    '大安區',
    '烏日區',
    '大肚區',
    '龍井區',
    '霧峰區',
    '太平區',
    '大里區',
    '和平區',
  ],
  台南市: [
    '中西區',
    '東區',
    '南區',
    '北區',
    '安平區',
    '安南區',
    '永康區',
    '歸仁區',
    '新化區',
    '左鎮區',
    '玉井區',
    '楠西區',
    '南化區',
    '仁德區',
    '關廟區',
    '龍崎區',
    '官田區',
    '麻豆區',
    '佳里區',
    '西港區',
    '七股區',
    '將軍區',
    '學甲區',
    '北門區',
    '新營區',
    '後壁區',
    '白河區',
    '東山區',
    '六甲區',
    '下營區',
    '柳營區',
    '鹽水區',
    '善化區',
    '大內區',
    '山上區',
    '新市區',
    '安定區',
  ],
  臺南市: [
    '中西區',
    '東區',
    '南區',
    '北區',
    '安平區',
    '安南區',
    '永康區',
    '歸仁區',
    '新化區',
    '左鎮區',
    '玉井區',
    '楠西區',
    '南化區',
    '仁德區',
    '關廟區',
    '龍崎區',
    '官田區',
    '麻豆區',
    '佳里區',
    '西港區',
    '七股區',
    '將軍區',
    '學甲區',
    '北門區',
    '新營區',
    '後壁區',
    '白河區',
    '東山區',
    '六甲區',
    '下營區',
    '柳營區',
    '鹽水區',
    '善化區',
    '大內區',
    '山上區',
    '新市區',
    '安定區',
  ],
  高雄市: [
    '楠梓區',
    '左營區',
    '鼓山區',
    '三民區',
    '鹽埕區',
    '前金區',
    '新興區',
    '苓雅區',
    '前鎮區',
    '小港區',
    '旗津區',
    '鳳山區',
    '大寮區',
    '鳥松區',
    '林園區',
    '仁武區',
    '大樹區',
    '大社區',
    '岡山區',
    '路竹區',
    '橋頭區',
    '梓官區',
    '彌陀區',
    '永安區',
    '燕巢區',
    '田寮區',
    '阿蓮區',
    '茄萣區',
    '湖內區',
    '旗山區',
    '美濃區',
    '內門區',
    '杉林區',
    '甲仙區',
    '六龜區',
    '茂林區',
    '桃源區',
    '那瑪夏區',
  ],
  基隆市: ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
  新竹市: ['東區', '北區', '香山區'],
  嘉義市: ['東區', '西區'],
  新竹縣: [
    '竹北市',
    '竹東鎮',
    '新埔鎮',
    '關西鎮',
    '湖口鄉',
    '新豐鄉',
    '芎林鄉',
    '橫山鄉',
    '北埔鄉',
    '寶山鄉',
    '峨眉鄉',
    '尖石鄉',
    '五峰鄉',
  ],
  苗栗縣: [
    '苗栗市',
    '頭份市',
    '竹南鎮',
    '後龍鎮',
    '通霄鎮',
    '苑裡鎮',
    '卓蘭鎮',
    '造橋鄉',
    '西湖鄉',
    '頭屋鄉',
    '公館鄉',
    '銅鑼鄉',
    '三義鄉',
    '大湖鄉',
    '獅潭鄉',
    '三灣鄉',
    '南庄鄉',
    '泰安鄉',
  ],
  彰化縣: [
    '彰化市',
    '鹿港鎮',
    '和美鎮',
    '線西鄉',
    '伸港鄉',
    '福興鄉',
    '秀水鄉',
    '花壇鄉',
    '芬園鄉',
    '員林市',
    '溪湖鎮',
    '田中鎮',
    '大村鄉',
    '埔鹽鄉',
    '埤頭鄉',
    '北斗鎮',
    '田尾鄉',
    '大城鄉',
    '芳苑鄉',
    '二林鎮',
    '溪州鄉',
    '竹塘鄉',
    '二水鄉',
    '社頭鄉',
    '永靖鄉',
  ],
  南投縣: [
    '南投市',
    '埔里鎮',
    '草屯鎮',
    '竹山鎮',
    '集集鎮',
    '名間鄉',
    '鹿谷鄉',
    '中寮鄉',
    '魚池鄉',
    '國姓鄉',
    '水里鄉',
    '信義鄉',
    '仁愛鄉',
  ],
  雲林縣: [
    '斗六市',
    '斗南鎮',
    '虎尾鎮',
    '西螺鎮',
    '土庫鎮',
    '北港鎮',
    '古坑鄉',
    '大埤鄉',
    '莿桐鄉',
    '林內鄉',
    '二崙鄉',
    '崙背鄉',
    '麥寮鄉',
    '東勢鄉',
    '褒忠鄉',
    '臺西鄉',
    '元長鄉',
    '四湖鄉',
    '口湖鄉',
    '水林鄉',
  ],
  嘉義縣: [
    '太保市',
    '朴子市',
    '布袋鎮',
    '大林鎮',
    '民雄鄉',
    '溪口鄉',
    '新港鄉',
    '六腳鄉',
    '東石鄉',
    '義竹鄉',
    '鹿草鄉',
    '水上鄉',
    '中埔鄉',
    '竹崎鄉',
    '梅山鄉',
    '番路鄉',
    '大埔鄉',
    '阿里山鄉',
  ],
  屏東縣: [
    '屏東市',
    '潮州鎮',
    '東港鎮',
    '恆春鎮',
    '萬丹鄉',
    '長治鄉',
    '麟洛鄉',
    '九如鄉',
    '里港鄉',
    '鹽埔鄉',
    '高樹鄉',
    '萬巒鄉',
    '內埔鄉',
    '竹田鄉',
    '新埤鄉',
    '枋寮鄉',
    '新園鄉',
    '崁頂鄉',
    '林邊鄉',
    '南州鄉',
    '佳冬鄉',
    '琉球鄉',
    '車城鄉',
    '滿州鄉',
    '枋山鄉',
    '三地門鄉',
    '霧台鄉',
    '瑪家鄉',
    '泰武鄉',
    '來義鄉',
    '春日鄉',
    '獅子鄉',
    '牡丹鄉',
  ],
  宜蘭縣: [
    '宜蘭市',
    '羅東鎮',
    '蘇澳鎮',
    '頭城鎮',
    '礁溪鄉',
    '壯圍鄉',
    '員山鄉',
    '冬山鄉',
    '五結鄉',
    '三星鄉',
    '大同鄉',
    '南澳鄉',
  ],
  花蓮縣: [
    '花蓮市',
    '鳳林鎮',
    '玉里鎮',
    '新城鄉',
    '吉安鄉',
    '壽豐鄉',
    '光復鄉',
    '豐濱鄉',
    '瑞穗鄉',
    '萬榮鄉',
    '富里鄉',
    '卓溪鄉',
    '秀林鄉',
  ],
  台東縣: [
    '臺東市',
    '成功鎮',
    '關山鎮',
    '卑南鄉',
    '鹿野鄉',
    '池上鄉',
    '東河鄉',
    '長濱鄉',
    '太麻里鄉',
    '大武鄉',
    '綠島鄉',
    '海端鄉',
    '延平鄉',
    '金峰鄉',
    '達仁鄉',
    '蘭嶼鄉',
  ],
  臺東縣: [
    '臺東市',
    '成功鎮',
    '關山鎮',
    '卑南鄉',
    '鹿野鄉',
    '池上鄉',
    '東河鄉',
    '長濱鄉',
    '太麻里鄉',
    '大武鄉',
    '綠島鄉',
    '海端鄉',
    '延平鄉',
    '金峰鄉',
    '達仁鄉',
    '蘭嶼鄉',
  ],
  澎湖縣: ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
  金門縣: ['金城鎮', '金沙鎮', '金湖鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
  連江縣: ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
};

const SevenElevenStoreAutocomplete: React.FC<SevenElevenStoreAutocompleteProps> = ({
  city,
  town = '',
  value,
  onChange,
  onSelect,
  placeholder = '門市',
  disabled = false,
  required = false,
  inputClassName = '',
}) => {
  const [items, setItems] = useState<SevenElevenStoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setItems([]);
    setErrorMessage('');
  }, [city]);

  useEffect(() => {
    const keyword = value.trim();
    const resolvedCity = city.trim();
    const towns = CITY_TOWNS[resolvedCity] ?? (town.trim() ? [town.trim()] : []);
    if (!resolvedCity || towns.length === 0 || disabled || keyword.length === 0) {
      setItems([]);
      setErrorMessage('');
      fetchControllerRef.current?.abort();
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;
      setIsLoading(true);
      setErrorMessage('');

      try {
        console.log({ city: resolvedCity, towns, keyword });
        const storeMap = new Map<string, SevenElevenStoreItem>();

        for (const townName of towns) {
          const data = await search711Stores(
            { city: resolvedCity, town: townName, keyword },
            controller.signal,
          );
          const nextItems =
            data.items?.map((item) => ({
              id: item.id ?? '',
              name: item.name ?? '',
              address: item.address ?? '',
            })) ?? [];
          for (const item of nextItems) {
            if (item.id && item.name && !storeMap.has(item.id)) {
              storeMap.set(item.id, item);
            }
          }
        }

        setItems(Array.from(storeMap.values()));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setItems([]);
        setErrorMessage('門市搜尋失敗，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [city, town, value, disabled]);

  const handleSelect = (store: SevenElevenStoreItem) => {
    onSelect(store);
    setItems([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClassName}
      />
      {isLoading ? (
        <p className="mt-1 text-xs text-gray-500">搜尋中…</p>
      ) : null}
      {errorMessage ? <p className="mt-1 text-xs text-red-500">{errorMessage}</p> : null}
      {items.length > 0 ? (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          {items.map((store) => (
            <button
              key={`${store.id}-${store.name}`}
              type="button"
              onClick={() => handleSelect(store)}
              className="w-full text-left px-3 py-2 hover:bg-amber-50"
            >
              <p className="text-sm text-zinc-900">{store.name}</p>
              {store.address ? <p className="text-xs text-gray-500">{store.address}</p> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SevenElevenStoreAutocomplete;