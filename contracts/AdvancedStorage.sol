// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AdvancedStorage {

    string[] private storedStrings;

    event StringAdded(uint256 index, string value);    
    
    event StringRemoved(uint256 index, string value); 

    function addString(string memory _string) public{
        storedStrings.push(_string);
        emit StringAdded(storedStrings.length - 1, _string);
    }   

    function getString(uint256 _index) public view returns (string memory){
        require(_index < storedStrings.length, "Index out of bounds");
        return storedStrings[_index];
    }

    function getStringCount() public view returns (uint256){
        return storedStrings.length;
    }
}