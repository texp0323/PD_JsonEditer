using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

namespace GameData
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
}