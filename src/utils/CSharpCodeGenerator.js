// src/utils/CSharpCodeGenerator.js - 수정된 버전

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
                if (itemDictionary.ContainsKey(item.PrimaryKey))
                {
                    Debug.LogWarning($"<color=#ff0>(${className})중복된 PrimaryKey가 발견되었습니다: {item.PrimaryKey}</color>");
                    continue;
                }
                
                itemDictionary.Add(item.PrimaryKey, item);
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
        /// PrimaryKey로 아이템을 찾습니다. 없으면 기본 아이템을 반환합니다.
        /// </summary>
        public ${itemClassName} GetByPrimaryKeyOrDefault(string primaryKey, ${itemClassName} defaultItem = null)
        {
            if (itemDictionary.TryGetValue(primaryKey, out ${itemClassName} item))
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
        /// ${field.PropertyName === 'PrimaryKey' ? '[PK] 고유 식별자, Primary Key' : field.PropertyName}
        /// </summary>
        public ${csharpType} ${capitalizeFirstLetter(field.PropertyName)} { get; set; }`;
  });

  // 클래스 종료
  code += `
    }
}`;

  return code;
};

// DataBase 클래스 코드 생성
export const generateDataBaseClass = (namespace = "GameData") => {
  return `using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

namespace ${namespace}
{
    public abstract class DataBase
    {
        public virtual void Setup()
        {
            var type = GetType();
            var targetName = type.Name;

            if (_dataBaseMapString.ContainsKey(targetName).Equals(false))
            {
                _dataBaseMapString.Add(targetName, this);
                Debug.Log($"<color=#f0f>(DataBase)Setup Key({targetName}) :: MapString</color>");
            }
            else
            {
                Debug.Log($"<color=#f0f>(DataBase)Already Contains Key :: MapString </color>");
            }

            if (!_dataBaseMap.ContainsKey(type))
            {
                _dataBaseMap.Add(type, this);
                Debug.Log($"<color=#f0f>(DataBase)Setup Key</color>");
            }
            else
            {
                Debug.Log($"<color=#f0f>(DataBase)Already Contains Key </color>");
            }
        }

        #region [ Global Logic ]

        protected static readonly Dictionary<Type, DataBase> _dataBaseMap = new();
        protected static readonly Dictionary<string, DataBase> _dataBaseMapString = new();

        /// <summary>
        /// 모든 DataBase 상속 클래스의 인스턴스를 생성하고 JSON 데이터를 로드하여 캐싱합니다.
        /// </summary>
        public static void SetupAll(string basePath = "GameData")
        {
            Debug.Log("<color=#f0f>(DataBase)SetupAll Start</color>");

            var thisType = typeof(DataBase);
            var types = thisType.Assembly.GetTypes()
                .Where(t => t.IsClass && !t.IsAbstract && thisType.IsAssignableFrom(t))
                .ToList();

            int setupCount = 0;
            foreach (var type in types)
            {
                try
                {
                    if (_dataBaseMap.ContainsKey(type))
                        continue;

                    // 클래스 이름으로 JSON 파일 경로 생성
                    string className = type.Name;
                    string jsonFileName = $"{className}";
                    string jsonFilePath =$"{basePath}/{jsonFileName}";

                    // 인스턴스 생성
                    var instance = Activator.CreateInstance(type) as DataBase;
                    if (instance != null)
                    {
                        // Setup 호출 (기본 등록 수행)
                        instance.Setup();

                        // 해당 클래스에 LoadData 메서드가 있는지 확인 (리플렉션)
                        var loadDataMethod = type.GetMethod("LoadData");
                        if (loadDataMethod != null)
                        {
                            // LoadData 메서드 호출
                            loadDataMethod.Invoke(instance, new object[] { jsonFilePath });
                        }
                        else
                        {
                            Debug.LogError($"Cannot find LoadData method for type {type.Name}");
                            continue;
                        }

                        setupCount++;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"<color=#f55>(DataBase)Error creating instance of {type.Name}: {e.Message}</color>");
                }
            }

            Debug.Log($"<color=#f0f>(DataBase)SetupAll Complete. {setupCount} instances cached.</color>");
        }

        /// <summary>
        /// JSON 파일에서 데이터를 로드합니다.
        /// </summary>
        /// <typeparam name="T">로드할 데이터 타입</typeparam>
        /// <param name="filePath">JSON 파일 경로</param>
        /// <returns>로드된 데이터 리스트</returns>
        public static List<T> LoadFromJson<T>(string filePath) where T : class
        {
            try
            {
                var jsonTextAsset = Resources.Load(filePath) as TextAsset;
                
                if (jsonTextAsset == null)
                {
                    Debug.LogError($"<color=#f55>(DataBase)File not found: {filePath}</color>");
                    return new List<T>();
                }

                var data = JsonConvert.DeserializeObject<List<T>>(jsonTextAsset.text, converters:
                    new JsonConverter[]
                    {
                        new Bool2Converter(),
                        new Double2Converter(),
                        new Double3Converter(),
                        new Float2Converter(),
                        new Float3Converter(),
                        new Int2Converter(),
                        new Int3Converter(),
                        new Uint2Converter(),
                        new Uint3Converter(),
                        new Vector2Converter(),
                        new Vector3Converter()
                    });
                Debug.Log($"<color=#f0f>(DataBase)Loaded {data.Count} items from {filePath}</color>");
                return data;
            }
            catch (Exception e)
            {
                Debug.LogError($"<color=#f55>(DataBase)Error loading JSON from {filePath}: {e.Message}</color>");
                return new List<T>();
            }
        }


        public static T Get<T>() where T : DataBase
        {
            if (_dataBaseMap.ContainsKey(typeof(T)).Equals(false))
            {
                return null;
            }

            var result = _dataBaseMap[typeof(T)];

            return result as T;
        }

        public static DataBase Get(Type type)
        {
            if (_dataBaseMap.ContainsKey(type).Equals(false))
            {
                return null;
            }

            return _dataBaseMap[type];
        }

        public static DataBase Get(string name)
        {
            if (_dataBaseMapString.ContainsKey(name).Equals(false))
            {
                return null;
            }

            return _dataBaseMapString[name];
        }

        #endregion
    }
}`;
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