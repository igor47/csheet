import { z } from "zod"
import { NumberField, Checkbox, OptionalString } from "./src/lib/formSchemas"

// Test 1: Required number field
const requiredNumber = NumberField(z.number().int().min(1))
type RequiredNumberType = z.infer<typeof requiredNumber>

// Test 2: Optional number field (with .nullable() and .default())
const optionalNumber = NumberField(z.number().int().nullable().default(null))
type OptionalNumberType = z.infer<typeof optionalNumber>

// Test 3: Number with default
const numberWithDefault = NumberField(z.number().int().default(0))
type NumberWithDefaultType = z.infer<typeof numberWithDefault>

// Test 4: Checkbox
const checkbox = Checkbox()
type CheckboxType = z.infer<typeof checkbox>

// Test 5: Optional string
const optionalString = OptionalString()
type OptionalStringType = z.infer<typeof optionalString>

// Print the types at compile time by causing errors
const test1: RequiredNumberType = 42
const test2: OptionalNumberType = null
const test3: NumberWithDefaultType = 0
const test4: CheckboxType = true
const test5: OptionalStringType = null

console.log("Type test - required number:", typeof test1)
console.log("Type test - optional number:", test2)
console.log("Type test - number with default:", typeof test3)
console.log("Type test - checkbox:", typeof test4)
console.log("Type test - optional string:", test5)

// Runtime test
const result1 = requiredNumber.safeParse("42")
const result2 = optionalNumber.safeParse("")
const result3 = numberWithDefault.safeParse("")
const result4 = checkbox.safeParse("on")
const result5 = optionalString.safeParse("")

console.log("\nRuntime tests:")
console.log("Required number '42':", result1.success ? result1.data : result1.error)
console.log("Optional number '':", result2.success ? result2.data : result2.error)
console.log("Number with default '':", result3.success ? result3.data : result3.error)
console.log("Checkbox 'on':", result4.success ? result4.data : result4.error)
console.log("Optional string '':", result5.success ? result5.data : result5.error)

// Type assertions to verify compile-time types
const _typeCheck1: number = test1
const _typeCheck2: number | null = test2
const _typeCheck3: number = test3
const _typeCheck4: boolean = test4
const _typeCheck5: string | null = test5

console.log("\n✓ All type checks passed!")
