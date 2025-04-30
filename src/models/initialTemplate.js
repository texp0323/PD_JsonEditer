// 초기 템플릿 데이터
const initialTemplate = {
    fields: [
        { PropertyName: "id", DataType: "string" },
        { PropertyName: "name", DataType: "string" },
        { PropertyName: "type", DataType: "string" },
        { PropertyName: "hp", DataType: "int" },
        { PropertyName: "attack", DataType: "int" },
        { PropertyName: "defense", DataType: "int" },
        { PropertyName: "speed", DataType: "float" },
        { PropertyName: "isActive", DataType: "bool" },
        { PropertyName: "skills", DataType: "array" },
        { PropertyName: "equipment", DataType: "dict" }
    ]
};

// 사용 가능한 데이터 타입
export const availableDataTypes = ["string", "int", "float", "bool", "array", "dict"];

export default initialTemplate;