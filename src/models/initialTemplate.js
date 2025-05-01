
const initialTemplate = {
    fields: [
        { PropertyName: "PrimaryKey", DataType: "string", Required: true },
    ]
};

export const availableDataTypes = ["string", "int", "float", "bool", "array", "dict"];

export default initialTemplate;