// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    // State variable to store a string
    string private storedString;

    // Function to store a string
    function setString(string memory _string) public {
        storedString = _string;
    }

    // Function to retrieve the stored string
    function getString() public view returns (string memory) {
        return storedString;
    }
    
}