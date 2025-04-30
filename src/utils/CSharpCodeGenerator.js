// C# 클래스 생성기 모듈
export const generateCSharpClass = (template, className, namespace = "GameData") => {
  // 클래스 이름에서 Item 클래스 이름 생성
  const itemClassName = `${className}Item`;
  let code = '';

  // 필요한 imports 추가
  code += `using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace ${namespace}
{
    /// <summary>
    /// ${className} 데이터 관리 클래스
    /// </summary>
    public class ${className} : DataBase
    {
        private List<${itemClassName}> items = new List<${itemClassName}>();
        
        private Dictionary<string, ${itemClassName}> itemDictionary = new();

        /// <summary>
        /// 모든 ${className} 아이템 목록을 반환합니다.
        /// </summary>
        public List<${itemClassName}> Items => items;
        
        /// <summary>
        /// Dictionary를 재구축합니다.
        /// </summary>
        private void BuildDictionary()
        {
            itemDictionary.Clear();
            foreach (var item in items)
            {
                // 중복 키 체크
                if (itemDictionary.ContainsKey(item.id))
                {
                    Debug.LogWarning($"<color=#ff0>(${className})중복된 Key가 발견되었습니다: {item.id}</color>");
                    continue;
                }
                
                itemDictionary.Add(item.id, item);
            }
            Debug.Log($"<color=#0ff>(${className})Dictionary 구축 완료: {itemDictionary.Count} 아이템</color>");
        }

        
        /// <summary>
        /// 지정된 파일 경로에서 데이터를 로드합니다.
        /// </summary>
        public void LoadData(string filePath)
        {
            items = LoadFromJson<${itemClassName}>(filePath);
            BuildDictionary();
            Debug.Log($"<color=#0ff>(${className})Loaded {items.Count} items from {filePath}</color>");
        }
        
        /// <summary>
        /// Key로 아이템을 찾습니다. 없으면 기본 아이템을 반환합니다.
        /// </summary>
        public ${itemClassName} GetByKeyOrDefault(string dataKey, ${itemClassName} defaultItem = null)
        {
            if (itemDictionary.TryGetValue(dataKey, out ${itemClassName} item))
            {
                return item;
            }
            
            return defaultItem;
        }
        
        /// <summary>
        /// Key로 아이템 존재 여부를 확인합니다.
        /// </summary>
        public bool ContainsKey(string dataKey)
        {
            return itemDictionary.ContainsKey(dataKey);
        }
        
        /// <summary>
        /// 조건에 맞는 모든 아이템을 찾습니다.
        /// </summary>
        public List<${itemClassName}> FindAll(Predicate<${itemClassName}> predicate)
        {
            return items.FindAll(predicate);
        }
        
        /// <summary>
        /// 아이템의 인덱스를 반환합니다.
        /// </summary>
        public int IndexOf(${itemClassName} item)
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
    /// ${className} 아이템 클래스
    /// </summary>
    [Serializable]
    public class ${itemClassName}
    {`;

  // 템플릿의 각 필드를 기반으로 프로퍼티 생성
  template.fields.forEach(field => {
    // C# 데이터 타입 매핑
    let csharpType = mapToCSharpType(field.DataType);
    
    // 특수 케이스 처리 (array, dict 등)
    if (field.DataType === 'array') {
      csharpType = `List<string>`;
    } else if (field.DataType === 'dict') {
      csharpType = `List<KeyValuePair<string, float>>`;
    }

    // 프로퍼티 추가 (XML 문서화 주석 포함)
    code += `
        /// <summary>
        /// ${field.PropertyName === 'id' ? '[PK] Primary Key' : field.PropertyName}
        /// </summary>
        public ${csharpType} ${capitalizeFirstLetter(field.PropertyName)} { get; set; }`;
  });

  // 클래스 종료
  code += `
    }
}`;

  return code;
};

// 데이터 타입 매핑 (JSON 템플릿 -> C#)
const mapToCSharpType = (jsonType) => {
  switch (jsonType) {
    case 'string':
      return 'string';
    case 'int':
      return 'int';
    case 'float':
      return 'float';
    case 'bool':
      return 'bool';
    case 'array':
      return 'List<string>'; // 기본적으로 문자열 리스트로 처리
    case 'dict':
      return 'Dictionary<string, float>'; // 기본적으로 문자열-float 딕셔너리로 처리
    default:
      return 'object';
  }
};

// 첫 글자를 대문자로 변환
export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// 클래스 이름 생성 (예: unitData -> UnitData)
export const formatClassName = (className) => {
  // 소문자와 언더스코어로 된 이름을 파스칼 케이스로 변환
  return className
    .split('_')
    .map(part => 
      part
        .split(' ')
        .map(word => capitalizeFirstLetter(word))
        .join('')
    )
    .join('_');
};