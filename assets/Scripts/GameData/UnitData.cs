using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace GameData
{
    /// <summary>
    /// UnitData 데이터 관리 클래스
    /// </summary>
    public class UnitData : DataBase
    {
        private List<UnitDataItem> items = new List<UnitDataItem>();
        
        private Dictionary<string, UnitDataItem> itemDictionary = new();

        /// <summary>
        /// 모든 UnitData 아이템 목록을 반환합니다.
        /// </summary>
        public List<UnitDataItem> Items => items;
        
        /// <summary>
        /// Dictionary를 재구축합니다.
        /// </summary>
        private void BuildDictionary()
        {
            itemDictionary.Clear();
            foreach (var item in items)
            {
                // 중복 키 체크
                if (itemDictionary.ContainsKey(item.PrimaryKey))
                {
                    Debug.LogWarning($"<color=#ff0>(UnitData)중복된 PrimaryKey가 발견되었습니다: {item.PrimaryKey}</color>");
                    continue;
                }
                
                itemDictionary.Add(item.PrimaryKey, item);
            }
            Debug.Log($"<color=#0ff>(UnitData)Dictionary 구축 완료: {itemDictionary.Count} 아이템</color>");
        }

        
        /// <summary>
        /// 지정된 파일 경로에서 데이터를 로드합니다.
        /// </summary>
        public void LoadData(string filePath)
        {
            items = LoadFromJson<UnitDataItem>(filePath);
            BuildDictionary();
            Debug.Log($"<color=#0ff>(UnitData)Loaded {items.Count} items from {filePath}</color>");
        }
        
        /// <summary>
        /// PrimaryKey로 아이템을 찾습니다. 없으면 기본 아이템을 반환합니다.
        /// </summary>
        public UnitDataItem GetByPrimaryKeyOrDefault(string primaryKey, UnitDataItem defaultItem = null)
        {
            if (itemDictionary.TryGetValue(primaryKey, out UnitDataItem item))
            {
                return item;
            }
            
            return defaultItem;
        }
        
        /// <summary>
        /// PrimaryKey 존재 여부를 확인합니다.
        /// </summary>
        public bool ContainsPrimaryKey(string primaryKey)
        {
            return itemDictionary.ContainsKey(primaryKey);
        }
        
        /// <summary>
        /// 조건에 맞는 모든 아이템을 찾습니다.
        /// </summary>
        public List<UnitDataItem> FindAll(Predicate<UnitDataItem> predicate)
        {
            return items.FindAll(predicate);
        }
        
        /// <summary>
        /// 아이템의 인덱스를 반환합니다.
        /// </summary>
        public int IndexOf(UnitDataItem item)
        {
            return items.IndexOf(item);
        }
        
        /// <summary>
        /// 모든 아이템을 초기화합니다.
        /// </summary>
        public void Clear()
        {
            items.Clear();
        }
    }
    
    /// <summary>
    /// UnitData 아이템 클래스
    /// </summary>
    [Serializable]
    public class UnitDataItem
    {
        /// <summary>
        /// [PK] 고유 식별자, Primary Key
        /// </summary>
        public string PrimaryKey { get; set; }
        /// <summary>
        /// Name
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Description
        /// </summary>
        public string Description { get; set; }
        /// <summary>
        /// HealthPoint
        /// </summary>
        public int HealthPoint { get; set; }
        /// <summary>
        /// AttackPoint
        /// </summary>
        public int AttackPoint { get; set; }
        /// <summary>
        /// DefensePoint
        /// </summary>
        public int DefensePoint { get; set; }
        /// <summary>
        /// AttackSpeed
        /// </summary>
        public float AttackSpeed { get; set; }
        /// <summary>
        /// MoveSpeed
        /// </summary>
        public float MoveSpeed { get; set; }
        /// <summary>
        /// AttackRange
        /// </summary>
        public float AttackRange { get; set; }
        /// <summary>
        /// MoveRange
        /// </summary>
        public float MoveRange { get; set; }
    }
}