'use client'

import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, StopCircle } from "lucide-react"

export default function Html5Scanner({ onScanSuccess, onScanFailure }) {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState(null)
    const scannerRef = useRef(null)
    const divId = "reader-custom"

    useEffect(() => {
        // cleanup on unmount
        return () => {
            if (scannerRef.current) {
                if (isScanning) {
                    try {
                        scannerRef.current.stop().catch(console.error)
                    } catch (e) {
                         // ignore stop errors on unmount
                    }
                }
                try {
                     scannerRef.current.clear()
                } catch (e) {
                    // ignore
                }
            }
        }
    }, [isScanning])

    const startScanning = async () => {
        setError(null)
        try {
            // If instance exists, clear it first just in case
            if (scannerRef.current) {
                try { await scannerRef.current.clear() } catch(e){}
            }

            const scanner = new Html5Qrcode(divId)
            scannerRef.current = scanner
            
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    onScanSuccess(decodedText, decodedResult)
                },
                (errorMessage) => {
                    // onScanFailure(errorMessage)
                }
            )
            setIsScanning(true)
        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to start camera. Please ensure camera permissions are granted.")
            setIsScanning(false)
        }
    }

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
             try {
                await scannerRef.current.stop()
                setIsScanning(false)
             } catch (err) {
                 console.error(err)
             }
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative w-full min-h-[300px] overflow-hidden rounded-md bg-muted">
                {/* The scanner library controls this div entirely. React should never touch its children. */}
                <div id={divId} className="w-full h-full" />
                
                {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none bg-muted z-10">
                        Camera is off
                    </div>
                )}
            </div>
            
            {error && (
                <div className="text-red-500 text-sm bg-red-100 p-2 rounded w-full text-center">
                    {error}
                </div>
            )}

            {!isScanning ? (
                <Button onClick={startScanning} className="w-full" type="button">
                    <Camera className="mr-2 h-4 w-4" /> Start Camera
                </Button>
            ) : (
                <Button variant="destructive" onClick={stopScanning} className="w-full" type="button">
                    <StopCircle className="mr-2 h-4 w-4" /> Stop Camera
                </Button>
            )}
        </div>
    )
}
