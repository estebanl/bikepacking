"use client";
import * as THREE from "three";
import { Cable, Rod, CarbonSpar } from "./BicycleParts";
export function CockpitMesh({
  headTubeTop,
  stemClamp,
  handlebarType,
}: {
  headTubeTop: THREE.Vector3;
  stemClamp: THREE.Vector3;
  handlebarType: "drop" | "flat";
}) {
  return (
    <group>
      <Rod
        a={headTubeTop.toArray()}
        b={[headTubeTop.x - 0.009, headTubeTop.y + 0.035, 0]}
        r={0.021}
      />
      <Rod
        a={[headTubeTop.x - 0.009, headTubeTop.y + 0.035, 0]}
        b={stemClamp.toArray()}
        r={0.015}
      />
      <group position={stemClamp}>
        {handlebarType === "flat" ? (
          <>
            <Cable
              points={[
                [-0.045, 0.012, -0.37],
                [-0.006, 0.006, -0.2],
                [0, 0, 0],
                [-0.006, 0.006, 0.2],
                [-0.045, 0.012, 0.37],
              ]}
              r={0.014}
            />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Rod
                  a={[-0.025, 0.01, s * 0.26]}
                  b={[-0.045, 0.012, s * 0.37]}
                  r={0.017}
                />
                <Rod
                  a={[-0.02, 0.004, s * 0.24]}
                  b={[0.05, -0.028, s * 0.3]}
                  r={0.006}
                  color="#606b6c"
                />
              </group>
            ))}
          </>
        ) : (
          <>
            <Cable
              points={[
                [0.04, 0, -0.205],
                [0, 0.003, -0.15],
                [0, 0, 0],
                [0, 0.003, 0.15],
                [0.04, 0, 0.205],
              ]}
              r={0.013}
            />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Cable
                  points={[
                    [0, 0, s * 0.18],
                    [0.065, -0.012, s * 0.215],
                    [0.105, -0.055, s * 0.23],
                    [0.075, -0.112, s * 0.245],
                    [-0.035, -0.116, s * 0.25],
                  ]}
                  r={0.015}
                />
                <CarbonSpar
                  points={[
                    [0.05, -0.008, s * 0.212],
                    [0.092, 0.032, s * 0.217],
                    [0.106, 0.018, s * 0.218],
                  ]}
                  radii={[0.02, 0.017, 0.014]}
                  color="#252d2e"
                  depth={0.75}
                />
                <Cable
                  points={[
                    [0.112, 0.006, s * 0.22],
                    [0.123, -0.044, s * 0.225],
                    [0.106, -0.084, s * 0.23],
                  ]}
                  r={0.005}
                  color="#3f494c"
                />
              </group>
            ))}
          </>
        )}
      </group>
    </group>
  );
}
