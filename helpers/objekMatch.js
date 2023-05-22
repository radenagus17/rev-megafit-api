const arr = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
  { id: 3, name: "Doe" },
  { id: 4, name: "Alice" },
  { id: 5, name: "Bob" },
];
const searchTerms = [
  { id: 2, name: "Jane" },
  { id: 5, name: "Bob" },
];

const matchedData = arr.filter((item) => {
  // Memeriksa apakah item cocok dengan setiap searchTerm
  return searchTerms.some((searchTerm) => {
    return item.id === searchTerm.id && item.name === searchTerm.name;
  });
});

console.log(matchedData);
