import React, {useEffect, useState} from 'react';
import {
    Field,
    FieldGrid,
    FieldGridFirst,
    GridItem,
    Headline,
    InputField,
    marginsInput,
    RangeBox
} from '../../components/GlobalComponents.jsx';
import {Scenario} from "../../components/Scenario";
import InputButtons from "../../components/InputButtons";
import {MDBCol, MDBRow} from "mdb-react-ui-kit";
import RangeSlider from "../../components/RangeSlider";
import LamportsLogicalClocksAlgorithm from "./LamportsLogicalClocksAlgorithm";
import {createToastError, getScenario} from "../../components/GlobalFunctions.jsx";
import data from "../../assets/data.json";
import {toast, ToastContainer} from "react-toastify";
import {LamportsLogicalClocksSolver} from "./LamportsLogicalClocksSolver.js";


const LamportsLogicalClocks = () => {
        const [processorAmount, setProcessorAmount] = useState(3);
        const [rowAmount, setRowAmount] = useState(9);
        const [activeEditMode, setActiveEditMode] = useState(true);
        const [processors, setProcessors] = useState(Array.from({length: processorAmount}, () => Array.from({length: rowAmount}, (_, i) => i)));
        const [example] = useState(() => {
            const exampleData = data.data.find(item => item.name === 'LamportsLogicalClocks');
            const {processors, rows, values, arrows} = exampleData.details.find(item => item.type === 'example');
            return {processors, rows, values, arrows};
        });
        const [clickedInput, setClickedInput] = useState(0);
        const [arrows, setArrows] = useState([]);
        const numArrows = arrows.length - 1;

        useEffect(() => {
            setProcessors(prevColumns => {
                return Array.from({length: processorAmount}, (_, i) => {
                    const existingColumn = prevColumns[i];
                    const newNumber = existingColumn?.[1] || 1;
                    return Array.from({length: rowAmount}, (_, j) => (existingColumn && existingColumn[j] !== undefined ? existingColumn[j] : j * newNumber));
                });
            });
        }, [processorAmount, rowAmount]);

        const setExampleData = () => {
            setProcessorAmount(example.processors);
            setRowAmount(example.rows);
            example.values.forEach((value, index) => {
                handleInputChange(index, 1, value);
            });
            setArrows(example.arrows);
        };

        const resetFormValues = () => {
            setProcessorAmount(3);
            setRowAmount(9);
            example.values.forEach((value, index) => {
                handleInputChange(index, 1, 1);
            });
            setArrows([]);
        };

        const changeActiveEditMode = (newActiveEditMode) => {
            if (newActiveEditMode) {
                initializeProcessors();
            }
            setActiveEditMode(newActiveEditMode);
        }

        const handleInputChange = (columnIndex, index, newValue) => {
            if (newValue === '') {
                const newColumns = [...processors];
                newColumns[columnIndex][index] = '';
                setProcessors(newColumns);
            } else {
                const parsedValue = parseInt(newValue, 10);

                if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 10) {
                    const newColumns = [...processors];
                    newColumns[columnIndex][index] = parsedValue;

                    for (let i = 2; i < newColumns[columnIndex].length; i++) {
                        newColumns[columnIndex][i] = newColumns[columnIndex][1] * i;
                    }
                    setProcessors(newColumns);
                }
            }
            initializeProcessors();
        };

        const handleInputFieldClick = async (id, processorIdx, blockIdx) => {
            if (!activeEditMode) {
                if (arrows.some(arrow => arrow[0][0] === id)) {
                    createToastError('You can\'t select a Block twice!', toast.POSITION.TOP_RIGHT);
                } else if (arrows.some(arrow => arrow[1] && arrow[1][0] === id)) {
                    createToastError('You can\'t select a Block twice, select another!', toast.POSITION.TOP_RIGHT);
                } else {
                    if (clickedInput % 2 === 0) {
                        setClickedInput(1);
                        setArrows([...arrows, [[id, processorIdx, blockIdx], null]]);
                    } else {
                        let lastArrow = arrows[numArrows][0];
                        if (Math.abs(lastArrow[1] - processorIdx) !== 1) {
                            createToastError('You can only select a direct neighbor. Please select again.', toast.POSITION.TOP_RIGHT);
                        } else if (lastArrow[2] === blockIdx) {
                            createToastError('You can only select a higher or lower field. Please select again.', toast.POSITION.TOP_RIGHT);
                        } else {
                            let updatedArrow = [lastArrow, [id, processorIdx, blockIdx]];
                            if (arrows[numArrows][0][2] > blockIdx) {
                                updatedArrow = [[id, processorIdx, blockIdx], lastArrow];
                            }
                            setClickedInput(0);
                            const updatedArrows = [...arrows.slice(0, numArrows), updatedArrow];
                            setArrows(sortArrows(updatedArrows));
                        }
                    }
                }
            }
        };

        const sortArrows = (arrows) => {
            return arrows.sort((a, b) => a[1][2] - b[1][2]);
        };

        const deleteXArrow = (firstId, secondId) => {
            const updatedArrows = arrows.filter(arrowGroup =>
                !(
                    arrowGroup[0][0] === firstId &&
                    arrowGroup[1] &&
                    arrowGroup[1][0] === secondId
                )
            );
            setArrows(updatedArrows);
            initializeProcessors();
        };

        const handleSolveAlgorithm = () => {
            if (!activeEditMode) {
                initializeProcessors();
                const solver = new LamportsLogicalClocksSolver(arrows, processors);
                const solveResult = solver.solve();
                setProcessors([...solveResult]);
            } else {
                createToastError('You can only solve when Edit-Mode is Off!', toast.POSITION.TOP_RIGHT);
            }
        }

        const initializeProcessors = () => {
            const updatedProcessors = processors.map(processor => {
                return processor.map((value, j) => {
                    if (j !== 0) {
                        return processor[1] * j;
                    } else {
                        return value;
                    }
                });
            });
            setProcessors(updatedProcessors);
        };

        return (
            <FieldGrid>
                <FieldGridFirst>
                    <GridItem>
                        <InputField>
                            <Headline>Inputs</Headline>
                            <MDBRow tag="form" className='g-3' style={marginsInput}>
                                <MDBCol md="6">
                                    <RangeBox>
                                        <RangeSlider
                                            text={"Processors"}
                                            min={2}
                                            max={5}
                                            value={processorAmount}
                                            onChange={setProcessorAmount}/>
                                    </RangeBox>
                                </MDBCol>
                                <MDBCol md="6">
                                    <RangeBox>
                                        <RangeSlider
                                            text={"Rows"}
                                            min={6}
                                            max={12}
                                            value={rowAmount}
                                            onChange={setRowAmount}/>
                                    </RangeBox>
                                </MDBCol>
                            </MDBRow>
                            <InputButtons
                                resetForm={resetFormValues}
                                setExampleData={setExampleData}
                                activeEditMode={activeEditMode}
                                setActiveEditMode={changeActiveEditMode}
                                solveAlgorithm={handleSolveAlgorithm}/>
                        </InputField>
                    </GridItem>
                    <GridItem switchRows>
                        <Scenario scenario={getScenario("LamportsLogicalClocks", "scenario")}/>
                    </GridItem>
                </FieldGridFirst>
                <Field>
                    <Headline>Algorithm</Headline>
                    <LamportsLogicalClocksAlgorithm
                        processors={processors}
                        activeEditMode={activeEditMode}
                        handleInputChange={handleInputChange}
                        arrows={arrows}
                        handleInputFieldClick={handleInputFieldClick}
                        deleteXArrow={deleteXArrow}
                    />
                </Field>
                <ToastContainer/>
            </FieldGrid>
        );
    }
;

export default LamportsLogicalClocks;
